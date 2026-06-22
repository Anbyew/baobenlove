export function buildPaymentMemo(amount: number, label: string) {
  return `Krakoff Wedding 2026 — ${label}`;
}

export function openVenmo(amount: number, label: string) {
  const note = buildPaymentMemo(amount, label);
  const params = new URLSearchParams({
    txn: 'pay',
    recipients: 'Benjamin-Krakoff',
    amount: amount.toString(),
    note,
  });
  const webParams = new URLSearchParams({ txn: 'pay', amount: amount.toString(), note });
  const fallback = `https://venmo.com/Benjamin-Krakoff?${webParams.toString()}`;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (!isMobile) {
    window.open(fallback, '_blank');
    return;
  }

  const deepLink = `venmo://paycharge?${params.toString()}`;
  const start = Date.now();
  window.location.href = deepLink;
  setTimeout(() => {
    if (Date.now() - start < 2000 && document.hasFocus()) {
      window.open(fallback, '_blank');
    }
  }, 800);
}
