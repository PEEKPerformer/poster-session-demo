import { haptic } from '../lib/haptics.js'

/**
 * Render a number pad grid.
 * @param {Function} onInput - Called with the full current value string on each keypress
 * @param {Function} onClear - Called when clear is pressed
 */
export function createNumpad(onInput, onClear) {
  let value = ''

  const el = document.createElement('div')
  el.className = 'numpad'

  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'Clear', '0', '⌫',
  ]

  for (const key of keys) {
    const btn = document.createElement('button')
    btn.className = 'numpad__btn'
    btn.type = 'button'

    if (key === 'Clear' || key === '⌫') {
      btn.classList.add('numpad__btn--action')
    }

    btn.textContent = key

    btn.addEventListener('click', () => {
      haptic.trigger('selection')
      if (key === 'Clear') {
        value = ''
        onClear()
      } else if (key === '⌫') {
        value = value.slice(0, -1)
      } else {
        if (value.length < 3) {
          value += key
        }
      }
      onInput(value)
    })

    el.appendChild(btn)
  }

  // Keyboard support
  function onKeydown(e) {
    if (e.key >= '0' && e.key <= '9') {
      if (value.length < 3) value += e.key
      onInput(value)
    } else if (e.key === 'Backspace') {
      value = value.slice(0, -1)
      onInput(value)
    } else if (e.key === 'Escape') {
      value = ''
      onClear()
    }
  }

  document.addEventListener('keydown', onKeydown)

  el._destroy = () => document.removeEventListener('keydown', onKeydown)
  el._setValue = (v) => { value = v }
  el._getValue = () => value

  return el
}
