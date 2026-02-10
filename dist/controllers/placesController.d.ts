import { Request, Response } from 'express';
export declare const getAllPlaces: (req: Request, res: Response) => Promise<void>;
export declare const getPlaceById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updatePlace: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deletePlace: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updatePlaceStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=placesController.d.ts.map