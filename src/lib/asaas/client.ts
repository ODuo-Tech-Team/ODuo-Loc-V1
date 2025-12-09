// Cliente HTTP para API do Asaas

import type { AsaasCustomer, AsaasPayment, AsaasPixQrCode } from './types'

export class AsaasClient {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, environment: 'SANDBOX' | 'PRODUCTION' = 'SANDBOX') {
    this.apiKey = apiKey
    this.baseUrl = environment === 'PRODUCTION'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3'
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.errors?.[0]?.description ||
        errorData.message ||
        `Asaas API error: ${response.status}`
      )
    }

    return response.json()
  }

  /**
   * Cria um cliente no Asaas
   */
  async createCustomer(data: AsaasCustomer): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Busca um cliente no Asaas
   */
  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>(`/customers/${customerId}`)
  }

  /**
   * Cria uma cobrança no Asaas
   */
  async createPayment(data: AsaasPayment): Promise<AsaasPayment> {
    return this.request<AsaasPayment>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Busca uma cobrança no Asaas
   */
  async getPayment(paymentId: string): Promise<AsaasPayment> {
    return this.request<AsaasPayment>(`/payments/${paymentId}`)
  }

  /**
   * Busca o QR Code PIX de uma cobrança
   */
  async getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
    return this.request<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`)
  }

  /**
   * Cancela uma cobrança
   */
  async cancelPayment(paymentId: string): Promise<AsaasPayment> {
    return this.request<AsaasPayment>(`/payments/${paymentId}`, {
      method: 'DELETE',
    })
  }
}

/**
 * Factory para criar instância do cliente Asaas
 */
export function createAsaasClient(
  apiKey: string,
  environment: 'SANDBOX' | 'PRODUCTION' = 'SANDBOX'
): AsaasClient {
  return new AsaasClient(apiKey, environment)
}
