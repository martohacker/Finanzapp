import { test, expect, type Page } from '@playwright/test';

// La app consulta open.er-api.com para convertir gastos en otras monedas. Acá
// interceptamos esa API: nunca dependemos de la red real.
const API = 'https://open.er-api.com/**';

async function registrarUsuarioLocal(page: Page) {
  await page.goto('/');
  await page.getByText('Regístrate').click();
  await page.getByLabel('Nombre').fill('Test E2E');
  await page.getByLabel('Email').fill('e2e@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('1234');
  await page.getByRole('button', { name: 'Crear Cuenta' }).click();
  await page.getByRole('button', { name: 'Empezar' }).click();
}

/** Carga un gasto en USD (la moneda de la app es ARS, así que hay que convertirlo). */
async function cargarGastoEnDolares(page: Page, descripcion: string, monto: string) {
  await page.getByRole('button', { name: 'Gastos', exact: true }).click();
  const form = page.locator('form').filter({ has: page.getByPlaceholder('¿En qué gastaste?') });
  await form.getByPlaceholder('¿En qué gastaste?').fill(descripcion);
  await form.getByPlaceholder('0', { exact: true }).fill(monto);
  await form.getByRole('button', { name: 'Fecha y moneda' }).click();
  await form.locator('select').last().selectOption('USD');
  await form.getByRole('button', { name: 'Agregar', exact: true }).click();
}

test('si la API de cotizaciones falla se muestra el aviso y no montos convertidos', async ({ page }) => {
  let llamadas = 0;
  await page.route(API, (route) => {
    llamadas++;
    return route.fulfill({ status: 500, body: 'error' });
  });

  await registrarUsuarioLocal(page);
  await cargarGastoEnDolares(page, 'Libro', '100');

  // En la lista, la conversión del gasto muestra el aviso y no un equivalente en pesos
  // (GastoList la renderiza dos veces, para móvil y escritorio: tomamos la visible)
  const conversion = page
    .getByText('Equivalente en Peso Argentino', { exact: true })
    .filter({ visible: true })
    .locator('xpath=ancestor::div[contains(@class, "rounded-lg")][1]');
  await expect(conversion.getByText('Cotización no disponible')).toBeVisible();
  await expect(conversion.locator('p.font-bold')).toHaveCount(0);

  // En el inicio, las estadísticas se reemplazan por el aviso
  await page.getByRole('button', { name: 'Inicio', exact: true }).click();
  await expect(page.getByText('Tenés gastos en otras monedas y no pudimos obtener el tipo de cambio.')).toBeVisible();
  await expect(page.getByText('Total de Gastos', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Gasto del Mes', { exact: true })).toHaveCount(0);

  // Ni 1:1 (US$ 100 → $ 100) ni ningún otro monto de gastos convertido
  const balance = page.getByText('Balance del mes').locator('xpath=ancestor::div[contains(@class, "rounded-lg")][1]');
  await expect(balance.getByText('Cotización no disponible')).toBeVisible();
  await expect(balance.getByText('-$ 100')).toHaveCount(0);

  expect(llamadas).toBeGreaterThan(0);
});

test('con cotización disponible se muestran los montos convertidos', async ({ page }) => {
  await page.route(API, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: 'success', base_code: 'USD', rates: { USD: 1, ARS: 1500 } }),
    })
  );

  await registrarUsuarioLocal(page);
  await cargarGastoEnDolares(page, 'Libro', '100');

  await page.getByRole('button', { name: 'Inicio', exact: true }).click();
  await expect(page.getByText('Cotización no disponible')).toHaveCount(0);
  await expect(
    page.getByText('Total de Gastos', { exact: true }).locator('xpath=following-sibling::p')
  ).toHaveText(/150\.000/);
});

test('mientras cargan las cotizaciones el inicio muestra un estado de carga, no montos sin convertir', async ({ page }) => {
  // Retenemos la respuesta de la API hasta que el test la libere
  let liberar!: () => void;
  const respuestaLiberada = new Promise<void>((resolve) => (liberar = resolve));
  await page.route(API, async (route) => {
    await respuestaLiberada;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: 'success', base_code: 'USD', rates: { USD: 1, ARS: 1500 } }),
    });
  });

  await registrarUsuarioLocal(page);
  await cargarGastoEnDolares(page, 'Libro', '100');
  await page.getByRole('button', { name: 'Inicio', exact: true }).click();

  // Cotización pendiente: carga visible y ningún monto (ni US$ 100 sumado como $ 100)
  await expect(page.getByText('Cargando cotizaciones…')).toBeVisible();
  await expect(page.getByText('Total de Gastos', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Cotización no disponible')).toHaveCount(0);

  liberar();

  await expect(
    page.getByText('Total de Gastos', { exact: true }).locator('xpath=following-sibling::p')
  ).toHaveText(/150\.000/);
  await expect(page.getByText('Cargando cotizaciones…')).toHaveCount(0);
});
