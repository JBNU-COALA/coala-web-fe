import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, expect, it } from 'vitest'
import { LoginRequiredState } from './LoginRequiredState'

afterEach(cleanup)

it('opens login and preserves the full return location', async () => {
  function LoginDestination() {
    const location = useLocation()
    return <p>{location.state.from.pathname}{location.state.from.search}</p>
  }
  render(<MemoryRouter initialEntries={['/services/official/instance?view=apply']}><Routes>
    <Route path="/services/official/instance" element={<LoginRequiredState />} />
    <Route path="/login" element={<LoginDestination />} />
  </Routes></MemoryRouter>)
  expect(await screen.findByText('/services/official/instance?view=apply')).toBeTruthy()
})
