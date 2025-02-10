import React from 'react';
import { render, screen } from '@testing-library/react';
import Homepage from './Homepage';

describe('App Component', () => {
  it('renders learn react link', () => {
    render(<Homepage />)
    const linkElement = screen.getByText(/Sistema de Gestão Valex/i);
    expect(linkElement).toBeInTheDocument();
  });
});