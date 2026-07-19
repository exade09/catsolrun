import { Component, type ErrorInfo, type ReactNode } from 'react'

interface GameErrorBoundaryProps {
  children: ReactNode
}

interface GameErrorBoundaryState {
  failed: boolean
}

export class GameErrorBoundary extends Component<
  GameErrorBoundaryProps,
  GameErrorBoundaryState
> {
  state: GameErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): GameErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('The 3D game view could not be rendered.', error, info)
  }

  private retry = () => this.setState({ failed: false })

  render() {
    if (this.state.failed) {
      return (
        <div className="game-fallback" role="alert">
          <span className="game-fallback__signal" aria-hidden="true" />
          <p className="game-fallback__eyebrow">3D signal interrupted</p>
          <h2>The game view could not start</h2>
          <p>
            Try a current browser with WebGL enabled. The rest of the site is still available
          </p>
          <button className="button button--primary" type="button" onClick={this.retry}>
            Retry 3D View
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
