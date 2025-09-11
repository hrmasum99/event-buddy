export class SSLSuccessIPNDTO {
  status: string; // 'VALID','VALIDATED'
  tran_id: string;
  val_id: string;
  amount: string;
  store_amount?: string;
  bank_tran_id?: string;
  card_type?: string;
  card_no?: string;
  currency?: string;
  // ... include other fields you need
}
