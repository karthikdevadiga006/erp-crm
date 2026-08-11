import { Request, Response } from "express";
import { parsePagination } from "../../utils/pagination";
import * as productsService from "./products.service";

export async function listProductsHandler(req: Request, res: Response) {
  const { search, category, lowStock } = req.query as Record<string, string | undefined>;
  const result = await productsService.listProducts(
    { search, category, lowStock: lowStock === "true" },
    parsePagination(req)
  );
  res.status(200).json(result);
}

export async function getProductHandler(req: Request, res: Response) {
  const product = await productsService.getProductById(req.params.id);
  res.status(200).json({ data: product });
}

export async function createProductHandler(req: Request, res: Response) {
  const product = await productsService.createProduct(req.body);
  res.status(201).json({ data: product });
}

export async function updateProductHandler(req: Request, res: Response) {
  const product = await productsService.updateProduct(req.params.id, req.body);
  res.status(200).json({ data: product });
}

export async function listMovementsHandler(req: Request, res: Response) {
  const movements = await productsService.listMovements(req.params.id);
  res.status(200).json({ data: movements });
}

export async function adjustStockHandler(req: Request, res: Response) {
  const result = await productsService.adjustStock(req.params.id, req.body, req.user!.id);
  res.status(200).json({ data: result });
}
