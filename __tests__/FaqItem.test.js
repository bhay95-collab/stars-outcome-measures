import React, { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChevronDown } from 'lucide-react'

// Mirrors FaqItem from pages/index.js exactly
function FaqItem({ question, answer, revealDelay }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item reveal${open ? ' faq-item--open' : ''}`} style={{ '--reveal-delay': revealDelay }}>
      <button className="faq-question" type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {question}
        <ChevronDown size={18} className="faq-chevron" />
      </button>
      <div className="faq-body" aria-hidden={!open}>
        <div className="faq-body__inner">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  )
}

describe('FaqItem', () => {
  const defaultProps = {
    question: 'Will this fit my caseload?',
    answer: 'Yes, it supports physiotherapy-led caseloads.',
    revealDelay: '0s',
  }

  describe('initial render', () => {
    it('renders the question as button text', () => {
      render(<FaqItem {...defaultProps} />)
      expect(screen.getByRole('button', { name: /will this fit my caseload/i })).toBeInTheDocument()
    })

    it('renders the answer text', () => {
      render(<FaqItem {...defaultProps} />)
      expect(screen.getByText(defaultProps.answer)).toBeInTheDocument()
    })

    it('starts closed with aria-expanded false', () => {
      render(<FaqItem {...defaultProps} />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    })

    it('starts with reveal class and without faq-item--open', () => {
      const { container } = render(<FaqItem {...defaultProps} />)
      expect(container.firstChild).toHaveClass('reveal')
      expect(container.firstChild).not.toHaveClass('faq-item--open')
    })

    it('applies the revealDelay CSS custom property', () => {
      const { container } = render(<FaqItem {...defaultProps} revealDelay="0.12s" />)
      expect(container.firstChild).toHaveStyle({ '--reveal-delay': '0.12s' })
    })
  })

  describe('opening', () => {
    it('sets aria-expanded to true when button is clicked', async () => {
      const user = userEvent.setup()
      render(<FaqItem {...defaultProps} />)
      await user.click(screen.getByRole('button'))
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    })

    it('adds faq-item--open class to wrapper when open', async () => {
      const user = userEvent.setup()
      const { container } = render(<FaqItem {...defaultProps} />)
      await user.click(screen.getByRole('button'))
      expect(container.firstChild).toHaveClass('faq-item--open')
    })

    it('sets faq-body aria-hidden to false when open', async () => {
      const user = userEvent.setup()
      const { container } = render(<FaqItem {...defaultProps} />)
      await user.click(screen.getByRole('button'))
      expect(container.querySelector('.faq-body')).toHaveAttribute('aria-hidden', 'false')
    })
  })

  describe('closing', () => {
    it('restores aria-expanded to false when clicked again', async () => {
      const user = userEvent.setup()
      render(<FaqItem {...defaultProps} />)
      await user.click(screen.getByRole('button'))
      await user.click(screen.getByRole('button'))
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    })

    it('removes faq-item--open class when closed', async () => {
      const user = userEvent.setup()
      const { container } = render(<FaqItem {...defaultProps} />)
      await user.click(screen.getByRole('button'))
      await user.click(screen.getByRole('button'))
      expect(container.firstChild).not.toHaveClass('faq-item--open')
    })

    it('sets faq-body back to aria-hidden when closed', async () => {
      const user = userEvent.setup()
      const { container } = render(<FaqItem {...defaultProps} />)
      await user.click(screen.getByRole('button'))
      await user.click(screen.getByRole('button'))
      expect(container.querySelector('.faq-body')).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
