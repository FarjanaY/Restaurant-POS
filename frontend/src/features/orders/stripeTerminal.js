import { loadStripeTerminal } from '@stripe/terminal-js';
import { apiClient } from '../../api/client.js';

let terminalPromise = null;

function getTerminal() {
  if (!terminalPromise) {
    terminalPromise = loadStripeTerminal().then((StripeTerminal) =>
      StripeTerminal.create({
        onFetchConnectionToken: async () => {
          const { data } = await apiClient.post('/terminal/connection-token');
          return data.secret;
        },
        onUnexpectedReaderDisconnect: () => {
          // Surfacing this to the cashier is Phase 2 polish; for now it just stops
          // silently pretending the reader is still connected.
          terminalPromise = null;
        },
      })
    );
  }
  return terminalPromise;
}

// Connects to Stripe's test-mode simulated reader (no physical hardware needed
// in test mode — but this still requires a real Stripe test account to work at
// all, which this environment does not have configured).
export async function connectSimulatedReader() {
  const terminal = await getTerminal();
  const { discoveredReaders, error } = await terminal.discoverReaders({ simulated: true });
  if (error) throw new Error(error.message);
  if (!discoveredReaders.length) throw new Error('No simulated reader found');

  const connectResult = await terminal.connectReader(discoveredReaders[0]);
  if (connectResult.error) throw new Error(connectResult.error.message);
  return terminal;
}

export async function collectAndProcessCardPayment(clientSecret) {
  const terminal = await getTerminal();

  const collectResult = await terminal.collectPaymentMethod(clientSecret);
  if (collectResult.error) throw new Error(collectResult.error.message);

  const processResult = await terminal.processPayment(collectResult.paymentIntent);
  if (processResult.error) throw new Error(processResult.error.message);

  return processResult.paymentIntent;
}
