'use client'; // Bắt buộc phải có

import { Provider } from 'react-redux';
import { store } from './store'; // Đường dẫn tới file store.ts của bạn

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}