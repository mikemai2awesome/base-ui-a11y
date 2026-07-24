import { expect } from 'vitest';
import { screen, waitFor } from '@mui/internal-test-utils';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Autocomplete.Status />', () => {
  const { render } = createRenderer();

  describeConformance(<Autocomplete.Status />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Autocomplete.Root>{node}</Autocomplete.Root>);
    },
  }));

  it('is a polite live region', async () => {
    await render(
      <Autocomplete.Root open items={['apple']}>
        <Autocomplete.Status data-testid="status" />
      </Autocomplete.Root>,
    );

    const status = screen.getByTestId('status');
    expect(status).toHaveAttribute('role', 'status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('announces the number of available results', async () => {
    await render(
      <Autocomplete.Root open items={['apple', 'banana', 'cherry']}>
        <Autocomplete.Status data-testid="status" />
      </Autocomplete.Root>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toContain('3 results are available');
    });
  });

  it('announces the highlighted option', async () => {
    const { user } = await render(
      <Autocomplete.Root open items={['apple', 'banana', 'cherry']}>
        <Autocomplete.Input data-testid="input" />
        <Autocomplete.Status data-testid="status" />
      </Autocomplete.Root>,
    );

    await user.click(screen.getByTestId('input'));
    await user.keyboard('{ArrowDown}');

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toContain('apple 1 of 3 is highlighted');
    });
  });

  it('announces the no-results state', async () => {
    await render(
      <Autocomplete.Root open items={['apple']} defaultValue="zzz">
        <Autocomplete.Status data-testid="status" />
      </Autocomplete.Root>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toContain('No results found');
    });
  });

  it('prompts to type more characters when below minLength', async () => {
    await render(
      <Autocomplete.Root open items={['apple']} minLength={3} defaultValue="ap">
        <Autocomplete.Status data-testid="status" />
      </Autocomplete.Root>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toContain(
        'Type 3 or more characters for results',
      );
    });
  });

  it('renders custom children instead of generated content', async () => {
    await render(
      <Autocomplete.Root open items={['apple', 'banana']}>
        <Autocomplete.Status data-testid="status">Searching…</Autocomplete.Status>
      </Autocomplete.Root>,
    );

    expect(screen.getByTestId('status')).toHaveTextContent('Searching…');
    expect(screen.getByTestId('status').textContent).not.toContain('results are available');
  });

  it('localizes generated strings via the messages prop', async () => {
    await render(
      <Autocomplete.Root open items={['apple', 'banana']}>
        <Autocomplete.Status
          data-testid="status"
          messages={{ results: (count) => `${count} resultats disponibles` }}
        />
      </Autocomplete.Root>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toContain('2 resultats disponibles');
    });
  });
});
