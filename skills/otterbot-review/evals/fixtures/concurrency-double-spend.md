# PR fixture: async wallet withdrawal

Synthetic TypeScript PR. The entire function below is changed. It is called
concurrently by an HTTP handler; two requests for the same wallet can run at
the same time. `repo.getBalance` and `repo.setBalance` are separate queries
with no row lock or transaction, and no other guard exists on the caller path.

```ts
export async function withdraw(repo: WalletRepo, walletId: string, amount: number) {
  const balance = await repo.getBalance(walletId);
  if (balance < amount) throw new InsufficientFunds(walletId);
  await repo.setBalance(walletId, balance - amount);
  await payouts.send(walletId, amount);
}
```
