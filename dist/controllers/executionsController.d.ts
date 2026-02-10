import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const launchScraping: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getExecutions: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getExecutionById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getExecutionResults: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateExecutionStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCategories: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=executionsController.d.ts.map