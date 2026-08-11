import { Request, Response } from "express";
import { parsePagination } from "../../utils/pagination";
import * as challansService from "./challans.service";

export async function listChallansHandler(req: Request, res: Response) {
  const { status, customerId } = req.query as Record<string, string | undefined>;
  const result = await challansService.listChallans({ status, customerId }, parsePagination(req));
  res.status(200).json(result);
}

export async function getChallanHandler(req: Request, res: Response) {
  const challan = await challansService.getChallanById(req.params.id);
  res.status(200).json({ data: challan });
}

export async function createChallanHandler(req: Request, res: Response) {
  const challan = await challansService.createChallan(req.body, req.user!.id);
  res.status(201).json({ data: challan });
}

export async function updateChallanHandler(req: Request, res: Response) {
  const challan = await challansService.updateChallan(req.params.id, req.body);
  res.status(200).json({ data: challan });
}

export async function confirmChallanHandler(req: Request, res: Response) {
  const challan = await challansService.confirmChallan(req.params.id, req.user!.id);
  res.status(200).json({ data: challan });
}

export async function cancelChallanHandler(req: Request, res: Response) {
  const challan = await challansService.cancelChallan(req.params.id, req.user!.id);
  res.status(200).json({ data: challan });
}
