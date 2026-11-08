import { Component } from 'react';

// Error boundary for optional 3D: if a canvas or its model fails (no network for the GLB, lost WebGL context),
// render the fallback (default: nothing) instead of taking the page down. The page keeps its poster/photos.
export default class Quiet3D extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFail?.();
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
