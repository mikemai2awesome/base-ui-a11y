import { expect } from 'vitest';
import { screen, waitFor } from '@mui/internal-test-utils';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Autocomplete.AssistiveHint />', () => {
  const { render } = createRenderer();

  describeConformance(<Autocomplete.AssistiveHint />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Autocomplete.Root>{node}</Autocomplete.Root>);
    },
  }));

  it('is rendered by default and describes the input', async () => {
    await render(
      <Autocomplete.Root>
        <Autocomplete.Input data-testid="input" />
      </Autocomplete.Root>,
    );

    const input = screen.getByTestId('input');

    await waitFor(() => {
      expect(input.getAttribute('aria-describedby')).not.toBe(null);
    });

    const hintId = input.getAttribute('aria-describedby')!;
    const hint = document.getElementById(hintId);
    expect(hint?.textContent).toContain('use the arrow keys');
  });

  it('renders the default hint text', async () => {
    await render(
      <Autocomplete.Root>
        <Autocomplete.AssistiveHint data-testid="hint" />
      </Autocomplete.Root>,
    );

    expect(screen.getByTestId('hint').textContent).toContain('use the arrow keys');
  });

  it('replaces the default hint when a custom hint is provided', async () => {
    await render(
      <Autocomplete.Root>
        <Autocomplete.Input data-testid="input" />
        <Autocomplete.AssistiveHint data-testid="hint">Custom hint</Autocomplete.AssistiveHint>
      </Autocomplete.Root>,
    );

    const input = screen.getByTestId('input');
    const hint = screen.getByTestId('hint');

    await waitFor(() => {
      expect(input.getAttribute('aria-describedby')).toContain(hint.id);
    });

    // Only one assistive hint element exists (the default is suppressed).
    expect(screen.getAllByText('Custom hint')).toHaveLength(1);
  });

  it('renders custom hint text', async () => {
    await render(
      <Autocomplete.Root>
        <Autocomplete.AssistiveHint data-testid="hint">Custom hint</Autocomplete.AssistiveHint>
      </Autocomplete.Root>,
    );

    expect(screen.getByTestId('hint')).toHaveTextContent('Custom hint');
  });

  it('associates the hint with the input via aria-describedby', async () => {
    await render(
      <Autocomplete.Root>
        <Autocomplete.Input data-testid="input" />
        <Autocomplete.AssistiveHint data-testid="hint" />
      </Autocomplete.Root>,
    );

    const input = screen.getByTestId('input');
    const hint = screen.getByTestId('hint');

    await waitFor(() => {
      expect(input.getAttribute('aria-describedby')).toContain(hint.id);
    });
  });

  it('removes the association after the first input', async () => {
    const { user } = await render(
      <Autocomplete.Root items={['apple', 'banana']}>
        <Autocomplete.Input data-testid="input" />
        <Autocomplete.AssistiveHint data-testid="hint" />
      </Autocomplete.Root>,
    );

    const input = screen.getByTestId('input');
    const hint = screen.getByTestId('hint');

    await waitFor(() => {
      expect(input.getAttribute('aria-describedby')).toContain(hint.id);
    });

    await user.type(input, 'a');

    await waitFor(() => {
      expect(input.getAttribute('aria-describedby') ?? '').not.toContain(hint.id);
    });
  });
});
