/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Provider } from 'react-redux';
import App from '../App';
import { store } from '../src/redux/store';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <Provider store={store}>
        <App />
      </Provider>,
    );
  });
});
