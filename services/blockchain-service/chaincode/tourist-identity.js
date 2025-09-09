/*
 * SPDX-License-Identifier: Apache-2.0
 * Tourist Digital Identity Smart Contract
 * Manages secure digital identities for tourists with privacy preservation
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class TouristIdentityContract extends Contract {

    // Initialize the ledger with default values
    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        
        const identities = [
            {
                did: 'did:sitar:tourist:sample123',
                vcHash: 'abc123def456ghi789',
                issuer: 'did:sitar:authority:tourism-dept',
                subject: 'tourist-sample-123',
                issuanceDate: '2024-01-01T00:00:00Z',
                expirationDate: '2024-02-01T00:00:00Z',
                revoked: false,
                metadata: {
                    entryPoint: 'Delhi Airport',
                    nationality: 'India',
                    hasEmergencyContacts: true
                }
            }
        ];

        for (let i = 0; i < identities.length; i++) {
            identities[i].docType = 'digitalIdentity';
            await ctx.stub.putState(identities[i].did, Buffer.from(JSON.stringify(identities[i])));
            console.info('Added digital identity: ', identities[i]);
        }
        
        console.info('============= END : Initialize Ledger ===========');
    }

    // Issue a new digital identity
    async issueDigitalIdentity(ctx, did, vcHash, issuer, subject, issuanceDate, expirationDate, metadata) {
        console.info('============= START : Issue Digital Identity ===========');

        // Validate required fields
        if (!did || !vcHash || !issuer || !subject) {
            throw new Error('Missing required parameters');
        }

        // Check if DID already exists
        const existingIdentity = await ctx.stub.getState(did);
        if (existingIdentity && existingIdentity.length > 0) {
            throw new Error(`Digital identity ${did} already exists`);
        }

        // Create the digital identity
        const digitalIdentity = {
            docType: 'digitalIdentity',
            did,
            vcHash,
            issuer,
            subject,
            issuanceDate,
            expirationDate,
            revoked: false,
            revocationReason: null,
            issuedAt: new Date().toISOString(),
            metadata: metadata ? JSON.parse(metadata) : {}
        };

        // Put the identity on the ledger
        await ctx.stub.putState(did, Buffer.from(JSON.stringify(digitalIdentity)));

        // Emit event
        ctx.stub.setEvent('DigitalIdentityIssued', Buffer.from(JSON.stringify({
            did,
            issuer,
            subject,
            timestamp: digitalIdentity.issuedAt
        })));

        console.info('============= END : Issue Digital Identity ===========');
        return JSON.stringify(digitalIdentity);
    }

    // Query a digital identity by DID
    async queryDigitalIdentity(ctx, did) {
        const identityAsBytes = await ctx.stub.getState(did);
        if (!identityAsBytes || identityAsBytes.length === 0) {
            throw new Error(`Digital identity ${did} does not exist`);
        }
        return identityAsBytes.toString();
    }

    // Verify a digital identity
    async verifyDigitalIdentity(ctx, did, vcHash) {
        console.info('============= START : Verify Digital Identity ===========');

        const identityAsBytes = await ctx.stub.getState(did);
        if (!identityAsBytes || identityAsBytes.length === 0) {
            return JSON.stringify({ valid: false, reason: 'Identity not found' });
        }

        const identity = JSON.parse(identityAsBytes.toString());

        // Check if revoked
        if (identity.revoked) {
            return JSON.stringify({ 
                valid: false, 
                reason: 'Identity has been revoked',
                revocationReason: identity.revocationReason
            });
        }

        // Check expiration
        const now = new Date();
        const expirationDate = new Date(identity.expirationDate);
        if (now > expirationDate) {
            return JSON.stringify({ 
                valid: false, 
                reason: 'Identity has expired',
                expirationDate: identity.expirationDate
            });
        }

        // Verify hash
        if (identity.vcHash !== vcHash) {
            return JSON.stringify({ 
                valid: false, 
                reason: 'Invalid credential hash' 
            });
        }

        console.info('============= END : Verify Digital Identity ===========');
        return JSON.stringify({ 
            valid: true, 
            identity: {
                did: identity.did,
                issuer: identity.issuer,
                subject: identity.subject,
                issuanceDate: identity.issuanceDate,
                expirationDate: identity.expirationDate,
                metadata: identity.metadata
            }
        });
    }

    // Revoke a digital identity
    async revokeDigitalIdentity(ctx, did, reason) {
        console.info('============= START : Revoke Digital Identity ===========');

        const identityAsBytes = await ctx.stub.getState(did);
        if (!identityAsBytes || identityAsBytes.length === 0) {
            throw new Error(`Digital identity ${did} does not exist`);
        }

        const identity = JSON.parse(identityAsBytes.toString());

        if (identity.revoked) {
            throw new Error(`Digital identity ${did} is already revoked`);
        }

        // Update identity
        identity.revoked = true;
        identity.revocationReason = reason;
        identity.revokedAt = new Date().toISOString();

        // Put updated identity back on ledger
        await ctx.stub.putState(did, Buffer.from(JSON.stringify(identity)));

        // Emit event
        ctx.stub.setEvent('DigitalIdentityRevoked', Buffer.from(JSON.stringify({
            did,
            reason,
            timestamp: identity.revokedAt
        })));

        console.info('============= END : Revoke Digital Identity ===========');
        return JSON.stringify(identity);
    }

    // Update identity metadata (non-sensitive info only)
    async updateIdentityMetadata(ctx, did, metadata) {
        console.info('============= START : Update Identity Metadata ===========');

        const identityAsBytes = await ctx.stub.getState(did);
        if (!identityAsBytes || identityAsBytes.length === 0) {
            throw new Error(`Digital identity ${did} does not exist`);
        }

        const identity = JSON.parse(identityAsBytes.toString());

        if (identity.revoked) {
            throw new Error(`Cannot update revoked identity ${did}`);
        }

        // Update metadata
        identity.metadata = { ...identity.metadata, ...JSON.parse(metadata) };
        identity.lastUpdated = new Date().toISOString();

        await ctx.stub.putState(did, Buffer.from(JSON.stringify(identity)));

        console.info('============= END : Update Identity Metadata ===========');
        return JSON.stringify(identity);
    }

    // Query identities by issuer
    async queryIdentitiesByIssuer(ctx, issuer) {
        const queryString = {
            selector: {
                docType: 'digitalIdentity',
                issuer: issuer
            }
        };

        const resultsIterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(resultsIterator, false);

        return JSON.stringify(results);
    }

    // Query all active identities
    async queryActiveIdentities(ctx) {
        const queryString = {
            selector: {
                docType: 'digitalIdentity',
                revoked: false
            }
        };

        const resultsIterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(resultsIterator, false);

        return JSON.stringify(results);
    }

    // Get identity history
    async getIdentityHistory(ctx, did) {
        console.info('- start getIdentityHistory: %s\n', did);

        const resultsIterator = await ctx.stub.getHistoryForKey(did);
        const results = await this._getAllResults(resultsIterator, true);

        return JSON.stringify(results);
    }

    // Private helper function for query results
    async _getAllResults(iterator, isHistory) {
        let allResults = [];
        let res = await iterator.next();
        while (!res.done) {
            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                console.log(res.value.value.toString('utf8'));
                if (isHistory && isHistory === true) {
                    jsonRes.TxId = res.value.tx_id;
                    jsonRes.Timestamp = res.value.timestamp;
                    try {
                        jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Value = res.value.value.toString('utf8');
                    }
                } else {
                    jsonRes.Key = res.value.key;
                    try {
                        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Record = res.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonRes);
            }
            res = await iterator.next();
        }
        iterator.close();
        return allResults;
    }

    // Rich query for complex searches
    async queryIdentitiesWithPagination(ctx, queryString, pageSize, bookmark) {
        const { iterator, metadata } = await ctx.stub.getQueryResultWithPagination(queryString, parseInt(pageSize), bookmark);
        const results = await this._getAllResults(iterator, false);

        const response = {
            results,
            responseMetadata: {
                recordsCount: metadata.fetched_records_count,
                bookmark: metadata.bookmark
            }
        };

        return JSON.stringify(response);
    }
}

module.exports = TouristIdentityContract;
