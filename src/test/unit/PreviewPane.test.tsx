import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { PreviewPane } from '../../components/PreviewPane'
import { DEFAULT_PORTFOLIO } from '../../data/defaultPortfolio'
import { useDraftStore } from '../../store/useDraftStore'

describe('PreviewPane', () => {
  beforeEach(() => {
    useDraftStore.setState({
      liveState: structuredClone(DEFAULT_PORTFOLIO),
      draftState: structuredClone(DEFAULT_PORTFOLIO),
      isLiveLoading: false,
      previewKey: 0,
      pendingUploads: new Map(),
    })
  })

  it('TC-032: shows a skeleton while live data is loading', () => {
    useDraftStore.setState({ isLiveLoading: true })

    render(<PreviewPane />)

    expect(screen.getByText(/Loading preview/i)).toBeInTheDocument()
    expect(screen.queryByTitle('Portfolio Preview')).not.toBeInTheDocument()
  })

  it('TC-035: remounts the iframe when previewKey changes', async () => {
    const { container } = render(<PreviewPane />)
    const firstIframe = screen.getByTitle('Portfolio Preview')

    expect(firstIframe).toBeInTheDocument()

    await act(async () => {
      useDraftStore.getState().refreshPreview()
    })

    await waitFor(() => {
      expect(screen.getByTitle('Portfolio Preview')).not.toBe(firstIframe)
      expect(container.querySelector('.preview-skeleton')).not.toBeInTheDocument()
    })
  })
})