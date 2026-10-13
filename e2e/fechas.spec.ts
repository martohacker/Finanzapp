import { test, expect, type Page } from '@playwright/test';

// Reemplaza la prueba manual del bug de fechas UTC: el navegador corre en hora
// Argentina (timezoneId en playwright.config.ts) y fijamos el reloj con page.clock.

async function registrarUsuarioLocal(page: Page) {
  await page.goto('/');
  await page.getByText('Regístrate').click();
  await page.getByLabel('Nombre').fill('Test E2E');
  await page.getByLabel('Email').fill('e2e@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('1234');
  await page.getByRole('button', { name: 'Crear Cuenta' }).click();
  await page.getByRole('button', { name: 'Empezar' }).click();
}

async function cargarGasto(page: Page, descripcion: string, monto: string, fecha?: string) {
  await page.getByRole('button', { name: 'Gastos', exact: true }).click();
  const form = page.locator('form').filter({ has: page.getByPlaceholder('¿En qué gastaste?') });
  await form.getByPlaceholder('¿En qué gastaste?').fill(descripcion);
  await form.getByPlaceholder('0', { exact: true }).fill(monto);
  if (fecha) {
    await form.getByRole('button', { name: 'Fecha y moneda' }).click();
    await form.locator('input[type="date"]').fill(fecha);
  }
  await form.getByRole('button', { name: 'Agregar', exact: true }).click();
}

/** Fila de la lista de gastos: el ancestro más cercano de la descripción que incluye una fecha. */
function filaDeGasto(page: Page, descripcion: string) {
  return page
    .getByText(descripcion, { exact: true })
    .locator('xpath=ancestor::*[contains(., "/20")][1]');
}

/** Valor de una tarjeta de estadísticas del Inicio ("Gasto de Hoy", "Gasto del Mes", ...). */
function tarjeta(page: Page, titulo: string) {
  return page.getByText(titulo, { exact: true }).locator('xpath=following-sibling::p');
}

test('a las 22:30 hora Argentina un gasto nuevo queda con la fecha de hoy', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-13T22:30:00-03:00'));
  await registrarUsuarioLocal(page);

  await page.getByRole('button', { name: 'Gastos', exact: true }).click();
  await page.getByRole('button', { name: 'Fecha y moneda' }).click();
  await expect(page.locator('form input[type="date"]')).toHaveValue('2026-10-13');

  await cargarGasto(page, 'Cena', '100');
  await expect(filaDeGasto(page, 'Cena')).toContainText('13/10/2026');

  await page.getByRole('button', { name: 'Inicio', exact: true }).click();
  await expect(tarjeta(page, 'Gasto de Hoy')).toHaveText('$ 100');

  // Al día siguiente el gasto ya no es "de hoy". Con fechas UTC se guardaba como
  // 14/10 y recién acá se notaba el error (la lista lo mostraba bien por otro bug
  // que lo compensaba).
  await page.clock.setFixedTime(new Date('2026-10-14T09:00:00-03:00'));
  await page.reload();
  await expect(tarjeta(page, 'Gasto de Hoy')).toHaveText('$ 0');
  await page.getByRole('button', { name: 'Gastos', exact: true }).click();
  await expect(filaDeGasto(page, 'Cena')).toContainText('13/10/2026');
});

test('un gasto del 01/10/2026 cuenta en octubre', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-13T12:00:00-03:00'));
  await registrarUsuarioLocal(page);

  await cargarGasto(page, 'Alquiler', '100', '2026-10-01');

  await page.getByRole('button', { name: 'Inicio', exact: true }).click();
  await expect(tarjeta(page, 'Gasto del Mes')).toHaveText('$ 100');

  // Y no se cuela en septiembre
  await page.getByRole('button', { name: 'Mes anterior' }).click();
  await expect(tarjeta(page, 'Total de Gastos')).toHaveText('$ 0');
});
