import { Request, Response } from "express";
import { parsePagination } from "../../utils/pagination";
import * as customersService from "./customers.service";

export async function listCustomersHandler(req: Request, res: Response) {
  const { search, status, customerType } = req.query as Record<string, string | undefined>;
  const result = await customersService.listCustomers(
    { search, status, customerType },
    parsePagination(req)
  );
  res.status(200).json(result);
}

export async function getCustomerHandler(req: Request, res: Response) {
  const customer = await customersService.getCustomerById(req.params.id);
  res.status(200).json({ data: customer });
}

export async function createCustomerHandler(req: Request, res: Response) {
  const customer = await customersService.createCustomer(req.body, req.user!.id);
  res.status(201).json({ data: customer });
}

export async function updateCustomerHandler(req: Request, res: Response) {
  const customer = await customersService.updateCustomer(req.params.id, req.body);
  res.status(200).json({ data: customer });
}

export async function addFollowUpHandler(req: Request, res: Response) {
  const followUp = await customersService.addFollowUp(req.params.id, req.body.note, req.user!.id);
  res.status(201).json({ data: followUp });
}

export async function listFollowUpsHandler(req: Request, res: Response) {
  const followUps = await customersService.listFollowUps(req.params.id);
  res.status(200).json({ data: followUps });
}
