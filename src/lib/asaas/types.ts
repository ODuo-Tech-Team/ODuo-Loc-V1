// Tipos para integração com Asaas API

export interface AsaasCustomer {
  id?: string
  name: string
  email: string
  phone?: string
  cpfCnpj: string
  externalReference?: string
}

export interface AsaasCreditCard {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

export interface AsaasCreditCardHolderInfo {
  name: string
  email: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
  phone?: string
}

export interface AsaasPayment {
  id?: string
  customer: string
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'
  value: number
  dueDate: string
  description?: string
  externalReference?: string
  creditCard?: AsaasCreditCard
  creditCardHolderInfo?: AsaasCreditCardHolderInfo
  pixQrCodeId?: string
  pixCopyAndPaste?: string
  bankSlipUrl?: string
  invoiceUrl?: string
  status?: string
}

export interface AsaasPixQrCode {
  encodedImage: string
  payload: string
  expirationDate: string
}

export interface AsaasWebhookEvent {
  event: string
  payment: {
    id: string
    customer: string
    value: number
    netValue: number
    billingType: string
    status: string
    dueDate: string
    paymentDate?: string
    externalReference?: string
  }
}
