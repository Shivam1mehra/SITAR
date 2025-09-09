import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { BlockchainService } from '../services/BlockchainService';
import { Tourist } from '@sitar/types';

export class IdentityController {
  private router: Router;
  private blockchainService: BlockchainService;

  constructor(blockchainService: BlockchainService) {
    this.router = Router();
    this.blockchainService = blockchainService;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Issue new digital identity
    this.router.post('/issue', this.issueIdentity.bind(this));
    
    // Verify digital identity
    this.router.post('/verify', this.verifyIdentity.bind(this));
    
    // Get digital identity by DID
    this.router.get('/:did', this.getIdentity.bind(this));
    
    // Revoke digital identity
    this.router.post('/:did/revoke', this.revokeIdentity.bind(this));
    
    // Get all active identities
    this.router.get('/', this.getActiveIdentities.bind(this));
    
    // Get verifiable credential
    this.router.get('/:did/credential', this.getVerifiableCredential.bind(this));
  }

  private async issueIdentity(req: Request, res: Response): Promise<void> {
    try {
      // Validation schema
      const schema = Joi.object({
        tourist: Joi.object({
          id: Joi.string().required(),
          name: Joi.string().required(),
          nationality: Joi.string().required(),
          phoneNumber: Joi.string().required(),
          email: Joi.string().email().optional(),
          kycVerified: Joi.boolean().required(),
          kycDocument: Joi.object({
            type: Joi.string().valid('aadhaar', 'passport', 'visa').required(),
            number: Joi.string().required(),
            expiryDate: Joi.date().optional(),
            issuingCountry: Joi.string().optional()
          }).required(),
          emergencyContacts: Joi.array().items(
            Joi.object({
              name: Joi.string().required(),
              relationship: Joi.string().required(),
              phoneNumber: Joi.string().required(),
              email: Joi.string().email().optional(),
              isPrimary: Joi.boolean().required()
            })
          ).required()
        }).required(),
        tripDuration: Joi.object({
          start: Joi.date().required(),
          end: Joi.date().greater(Joi.ref('start')).required()
        }).required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.details
          }
        });
        return;
      }

      const { tourist, tripDuration } = value;

      // Issue digital identity
      const result = await this.blockchainService.issueDigitalIdentity(
        tourist,
        {
          start: new Date(tripDuration.start),
          end: new Date(tripDuration.end)
        }
      );

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to issue digital identity',
          details: { error: error.message }
        }
      });
    }
  }

  private async verifyIdentity(req: Request, res: Response): Promise<void> {
    try {
      const schema = Joi.object({
        did: Joi.string().required(),
        vcHash: Joi.string().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.details
          }
        });
        return;
      }

      const { did, vcHash } = value;

      const result = await this.blockchainService.verifyDigitalIdentity(did, vcHash);

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to verify digital identity',
          details: { error: error.message }
        }
      });
    }
  }

  private async getIdentity(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;

      if (!did) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'DID parameter is required'
          }
        });
        return;
      }

      const result = await this.blockchainService.getDigitalIdentity(did);

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve digital identity',
          details: { error: error.message }
        }
      });
    }
  }

  private async revokeIdentity(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;
      const schema = Joi.object({
        reason: Joi.string().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error || !did) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'DID and reason are required',
            details: error?.details
          }
        });
        return;
      }

      const { reason } = value;

      const result = await this.blockchainService.revokeDigitalIdentity(did, reason);

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to revoke digital identity',
          details: { error: error.message }
        }
      });
    }
  }

  private async getActiveIdentities(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.blockchainService.getActiveIdentities();

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve active identities',
          details: { error: error.message }
        }
      });
    }
  }

  private async getVerifiableCredential(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;

      if (!did) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'DID parameter is required'
          }
        });
        return;
      }

      const credential = await this.blockchainService.getVerifiableCredential(did);

      if (credential) {
        res.json({
          success: true,
          data: credential
        });
      } else {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Verifiable credential not found'
          }
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve verifiable credential',
          details: { error: error.message }
        }
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
