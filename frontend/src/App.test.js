import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the main app shell', () => {
  render(<App />);
  expect(screen.getByText(/community local economy/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /login with google/i })).toBeInTheDocument();
});
