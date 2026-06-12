export function openVenmo(amount: number, note: string) {
  const params = new URLSearchParams({
    txn: 'pay',
    recipients: 'baobenlove',
    amount: amount.toString(),
    note,
  });
  const fallback = 'https://venmo.com/baobenlove';
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
