import { Gateway, Network, Contract, Wallet, Wallets } from 'fabric-network';
import FabricCAServices from 'fabric-ca-client';
import * as crypto from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import winston from 'winston';

import { 
  DigitalIdentity, 
  VerifiableCredential, 
  Tourist,
  APIResponse 
} from '@sitar/types';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

export interface BlockchainConfig {
  networkName: string;
  channelName: string;
  chaincodeName: string;
  walletPath: string;
  connectionProfilePath: string;
  caUrl: string;
  mspId: string;
}

export class BlockchainService {
  private gateway: Gateway;
  private network: Network;
  private contract: Contract;
  private wallet: Wallet;
  private config: BlockchainConfig;

  constructor() {
    this.config = {
      networkName: process.env.BLOCKCHAIN_NETWORK_NAME || 'test-network',
      channelName: process.env.BLOCKCHAIN_CHANNEL_NAME || 'mychannel',
      chaincodeName: process.env.BLOCKCHAIN_CHAINCODE_NAME || 'tourist-identity',
      walletPath: process.env.BLOCKCHAIN_WALLET_PATH || './wallet',
      connectionProfilePath: process.env.BLOCKCHAIN_CONNECTION_PROFILE || './connection-profile.json',
      caUrl: process.env.BLOCKCHAIN_CA_URL || 'https://localhost:7054',
      mspId: process.env.BLOCKCHAIN_MSP_ID || 'Org1MSP'
    };
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing blockchain service...');
      
      // Create wallet
      this.wallet = await Wallets.newFileSystemWallet(this.config.walletPath);
      
      // Check if admin identity exists, if not create it
      await this.ensureAdminIdentity();
      
      // Create gateway
      this.gateway = new Gateway();
      
      // Load connection profile
      const connectionProfile = this.loadConnectionProfile();
      
      // Connect to gateway
      await this.gateway.connect(connectionProfile, {
        wallet: this.wallet,
        identity: 'admin',
        discovery: { enabled: true, asLocalhost: true }
      });
      
      // Get network and contract
      this.network = await this.gateway.getNetwork(this.config.channelName);
      this.contract = this.network.getContract(this.config.chaincodeName);
      
      logger.info('✅ Blockchain service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  private loadConnectionProfile(): any {
    try {
      const ccpPath = path.resolve(this.config.connectionProfilePath);
      const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
      return JSON.parse(ccpJSON);
    } catch (error) {
      // Fallback connection profile for development
      return {
        name: 'test-network-org1',
        version: '1.0.0',
        client: {
          organization: 'Org1',
          connection: {
            timeout: {
              peer: { endorser: '300' }
            }
          }
        },
        organizations: {
          Org1: {
            mspid: 'Org1MSP',
            peers: ['peer0.org1.example.com']
          }
        },
        peers: {
          'peer0.org1.example.com': {
            url: 'grpcs://localhost:7051',
            tlsCACerts: {
              pem: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n'
            },
            grpcOptions: {
              'ssl-target-name-override': 'peer0.org1.example.com',
              'hostnameOverride': 'peer0.org1.example.com'
            }
          }
        }
      };
    }
  }

  private async ensureAdminIdentity(): Promise<void> {
    try {
      const adminIdentity = await this.wallet.get('admin');
      if (!adminIdentity) {
        logger.info('Creating admin identity...');
        
        // For development, create a mock admin identity
        const adminKey = crypto.lib.WordArray.random(256/8).toString();
        const adminCert = this.generateMockCertificate('admin');
        
        const identity = {
          credentials: {
            certificate: adminCert,
            privateKey: adminKey
          },
          mspId: this.config.mspId,
          type: 'X.509'
        };
        
        await this.wallet.put('admin', identity);
        logger.info('✅ Admin identity created');
      }
    } catch (error) {
      logger.error('Failed to create admin identity:', error);
      throw error;
    }
  }

  private generateMockCertificate(identity: string): string {
    // Generate a mock certificate for development
    return `-----BEGIN CERTIFICATE-----
MIICSTCCAe+gAwIBAgIRAIQkrb/0PIc5P7+hULPVfbAwCgYIKoZIzj0EAwIwczEL
MAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG
cmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh
Lm9yZzEuZXhhbXBsZS5jb20wHhcNMjMwNjEwMDAwMDAwWhcNMzMwNjEwMDAwMDAw
WjBzMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMN
U2FuIEZyYW5jaXNjbzEZMBcGA1UEChMQb3JnMS5leGFtcGxlLmNvbTEcMBoGA1UE
AxMTY2Eub3JnMS5leGFtcGxlLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IA
BKIUl0Rq7EsKJhGhC3g7fX7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f
7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f
7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f
7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f7X7f
-----END CERTIFICATE-----`;
  }

  async issueDigitalIdentity(tourist: Tourist, tripDuration: { start: Date; end: Date }): Promise<APIResponse<DigitalIdentity>> {
    try {
      logger.info(`Issuing digital identity for tourist: ${tourist.id}`);
      
      // Generate DID
      const did = `did:sitar:tourist:${uuidv4()}`;
      
      // Create verifiable credential
      const vc = this.createVerifiableCredential(did, tourist, tripDuration);
      
      // Generate credential hash
      const vcHash = crypto.SHA256(JSON.stringify(vc)).toString();
      
      // Prepare metadata
      const metadata = {
        entryPoint: 'System Generated',
        nationality: tourist.nationality,
        hasEmergencyContacts: tourist.emergencyContacts.length > 0,
        kycVerified: tourist.kycVerified,
        phoneNumber: crypto.SHA256(tourist.phoneNumber).toString().substring(0, 16) // Hashed for privacy
      };
      
      // Submit transaction to blockchain
      const result = await this.contract.submitTransaction(
        'issueDigitalIdentity',
        did,
        vcHash,
        'did:sitar:authority:tourism-dept',
        tourist.id,
        tripDuration.start.toISOString(),
        tripDuration.end.toISOString(),
        JSON.stringify(metadata)
      );
      
      const digitalIdentity = JSON.parse(result.toString());
      
      // Store the verifiable credential securely (in production, this would be encrypted)
      await this.storeVerifiableCredential(did, vc);
      
      logger.info(`✅ Digital identity issued: ${did}`);
      
      return {
        success: true,
        data: {
          did: digitalIdentity.did,
          vcHash: digitalIdentity.vcHash,
          issuer: digitalIdentity.issuer,
          subject: digitalIdentity.subject,
          issuanceDate: new Date(digitalIdentity.issuanceDate),
          expirationDate: new Date(digitalIdentity.expirationDate),
          revoked: digitalIdentity.revoked,
          blockchainTxId: 'mock-tx-id-' + uuidv4()
        }
      };
    } catch (error) {
      logger.error('Failed to issue digital identity:', error);
      return {
        success: false,
        error: {
          code: 'BLOCKCHAIN_ERROR',
          message: 'Failed to issue digital identity',
          details: { error: error.message }
        }
      };
    }
  }

  async verifyDigitalIdentity(did: string, vcHash: string): Promise<APIResponse<{ valid: boolean; identity?: any; reason?: string }>> {
    try {
      logger.info(`Verifying digital identity: ${did}`);
      
      const result = await this.contract.evaluateTransaction('verifyDigitalIdentity', did, vcHash);
      const verification = JSON.parse(result.toString());
      
      return {
        success: true,
        data: verification
      };
    } catch (error) {
      logger.error('Failed to verify digital identity:', error);
      return {
        success: false,
        error: {
          code: 'VERIFICATION_ERROR',
          message: 'Failed to verify digital identity',
          details: { error: error.message }
        }
      };
    }
  }

  async revokeDigitalIdentity(did: string, reason: string): Promise<APIResponse<DigitalIdentity>> {
    try {
      logger.info(`Revoking digital identity: ${did}, reason: ${reason}`);
      
      const result = await this.contract.submitTransaction('revokeDigitalIdentity', did, reason);
      const revokedIdentity = JSON.parse(result.toString());
      
      return {
        success: true,
        data: {
          did: revokedIdentity.did,
          vcHash: revokedIdentity.vcHash,
          issuer: revokedIdentity.issuer,
          subject: revokedIdentity.subject,
          issuanceDate: new Date(revokedIdentity.issuanceDate),
          expirationDate: new Date(revokedIdentity.expirationDate),
          revoked: revokedIdentity.revoked,
          revocationReason: revokedIdentity.revocationReason,
          blockchainTxId: 'mock-tx-id-' + uuidv4()
        }
      };
    } catch (error) {
      logger.error('Failed to revoke digital identity:', error);
      return {
        success: false,
        error: {
          code: 'REVOCATION_ERROR',
          message: 'Failed to revoke digital identity',
          details: { error: error.message }
        }
      };
    }
  }

  async getDigitalIdentity(did: string): Promise<APIResponse<DigitalIdentity>> {
    try {
      logger.info(`Querying digital identity: ${did}`);
      
      const result = await this.contract.evaluateTransaction('queryDigitalIdentity', did);
      const identity = JSON.parse(result.toString());
      
      return {
        success: true,
        data: {
          did: identity.did,
          vcHash: identity.vcHash,
          issuer: identity.issuer,
          subject: identity.subject,
          issuanceDate: new Date(identity.issuanceDate),
          expirationDate: new Date(identity.expirationDate),
          revoked: identity.revoked,
          revocationReason: identity.revocationReason,
          blockchainTxId: 'mock-tx-id-' + uuidv4()
        }
      };
    } catch (error) {
      logger.error('Failed to query digital identity:', error);
      return {
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: 'Digital identity not found',
          details: { error: error.message }
        }
      };
    }
  }

  async getActiveIdentities(): Promise<APIResponse<DigitalIdentity[]>> {
    try {
      const result = await this.contract.evaluateTransaction('queryActiveIdentities');
      const identities = JSON.parse(result.toString());
      
      const formattedIdentities = identities.map((item: any) => ({
        did: item.Record.did,
        vcHash: item.Record.vcHash,
        issuer: item.Record.issuer,
        subject: item.Record.subject,
        issuanceDate: new Date(item.Record.issuanceDate),
        expirationDate: new Date(item.Record.expirationDate),
        revoked: item.Record.revoked,
        revocationReason: item.Record.revocationReason,
        blockchainTxId: 'mock-tx-id-' + uuidv4()
      }));
      
      return {
        success: true,
        data: formattedIdentities
      };
    } catch (error) {
      logger.error('Failed to query active identities:', error);
      return {
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: 'Failed to query active identities',
          details: { error: error.message }
        }
      };
    }
  }

  private createVerifiableCredential(did: string, tourist: Tourist, tripDuration: { start: Date; end: Date }): VerifiableCredential {
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://sitar.gov.in/credentials/v1'
      ],
      type: ['VerifiableCredential', 'TouristIdentityCredential'],
      issuer: 'did:sitar:authority:tourism-dept',
      issuanceDate: new Date().toISOString(),
      expirationDate: tripDuration.end.toISOString(),
      credentialSubject: {
        id: did,
        touristData: {
          name: tourist.name,
          nationality: tourist.nationality,
          kycVerified: tourist.kycVerified,
          tripDuration: {
            start: tripDuration.start.toISOString(),
            end: tripDuration.end.toISOString()
          },
          emergencyContacts: tourist.emergencyContacts
        }
      },
      proof: {
        type: 'Ed25519Signature2018',
        created: new Date().toISOString(),
        creator: 'did:sitar:authority:tourism-dept#keys-1',
        signatureValue: crypto.lib.WordArray.random(256/8).toString() // Mock signature
      }
    };
  }

  private async storeVerifiableCredential(did: string, vc: VerifiableCredential): Promise<void> {
    // In production, this would be stored in an encrypted database
    // For demo purposes, we'll simulate storage
    const vcPath = path.join(this.config.walletPath, 'credentials', `${did}.json`);
    
    try {
      // Ensure directory exists
      const dir = path.dirname(vcPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Encrypt the credential (in production)
      const encryptedVC = crypto.AES.encrypt(JSON.stringify(vc), process.env.ENCRYPTION_KEY || 'demo-key').toString();
      
      fs.writeFileSync(vcPath, JSON.stringify({ encrypted: encryptedVC }));
    } catch (error) {
      logger.warn('Failed to store verifiable credential locally:', error);
    }
  }

  async getVerifiableCredential(did: string): Promise<VerifiableCredential | null> {
    try {
      const vcPath = path.join(this.config.walletPath, 'credentials', `${did}.json`);
      
      if (!fs.existsSync(vcPath)) {
        return null;
      }
      
      const encryptedData = JSON.parse(fs.readFileSync(vcPath, 'utf8'));
      const decryptedBytes = crypto.AES.decrypt(encryptedData.encrypted, process.env.ENCRYPTION_KEY || 'demo-key');
      const decryptedVC = decryptedBytes.toString(crypto.enc.Utf8);
      
      return JSON.parse(decryptedVC);
    } catch (error) {
      logger.error('Failed to retrieve verifiable credential:', error);
      return null;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.gateway) {
        await this.gateway.disconnect();
        logger.info('Blockchain gateway disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting blockchain gateway:', error);
    }
  }
}
