import { test, expect } from '@playwright/test';

// Los términos del endpoint gratuito de ExchangeRate-API exigen atribución
// visible donde se muestran cotizaciones: la ponemos en el footer de la app.

test('el link de atribución de cotizaciones está en todas las secciones', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Regístrate').click();
  await page.getByLabel('Nombre').fill('Test E2E');
  await page.getByLabel('Email').fill('e2e@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('1234');
  await page.getByRole('button', { name: 'Crear Cuenta' }).click();
  await page.getByRole('button', { name: 'Empezar' }).click();

  for (const seccion of ['Inicio', 'Gastos', 'Presupuesto', 'Datos']) {
    await page.getByRole('button', { name: seccion, exact: true }).click();
    const link = page.getByRole('link', { name: 'Rates By Exchange Rate API' });
    await expect(link, `atribución en ${seccion}`).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://www.exchangerate-api.com');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  }
});
