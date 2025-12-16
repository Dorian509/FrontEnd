/**
 * Komponenten-Tests für LoginView.vue
 * Testet Form-Validation und Mode-Switching
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginView from '../LoginView.vue'
import { ref } from 'vue'

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock useAuth Composable
const mockLogin = vi.fn()
const mockRegister = vi.fn()
const mockContinueAsGuest = vi.fn()

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    continueAsGuest: mockContinueAsGuest,
    isAuthenticated: ref(false),
    token: ref(null),
    user: ref(null)
  })
}))

// Mock FontAwesome Icons
vi.mock('@fortawesome/vue-fontawesome', () => ({
  FontAwesomeIcon: {
    name: 'FontAwesomeIcon',
    template: '<i />'
  }
}))

describe('LoginView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sollte Form-Validation korrekt durchführen', async () => {
    const wrapper = mount(LoginView)

    // Submit ohne Daten
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Bitte fülle alle Felder aus')

    // Ungültige Email (fehlendes @)
    await wrapper.find('#email').setValue('invalid-email')
    await wrapper.find('#password').setValue('password123')
    await form.trigger('submit.prevent')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Bitte gib eine gültige E-Mail-Adresse ein')

    // Zu kurzes Passwort
    await wrapper.find('#email').setValue('test@example.com')
    await wrapper.find('#password').setValue('123')
    await form.trigger('submit.prevent')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Passwort muss mindestens 6 Zeichen lang sein')
  })

  it('sollte zwischen Login und Register-Modus wechseln', async () => {
    const wrapper = mount(LoginView)

    // Initial im Login-Modus
    expect(wrapper.text()).toContain('Einloggen')
    expect(wrapper.find('#name').exists()).toBe(false)

    // Zu Register wechseln
    const switchButtons = wrapper.findAll('.flex.gap-2.mb-6 button')
    expect(switchButtons.length).toBeGreaterThanOrEqual(2)

    await switchButtons[1]!.trigger('click')
    await wrapper.vm.$nextTick()

    // Name-Feld sollte jetzt sichtbar sein
    expect(wrapper.find('#name').exists()).toBe(true)
    expect(wrapper.text()).toContain('Dein Name')

    // Zurück zu Login wechseln
    await switchButtons[0]!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#name').exists()).toBe(false)
  })
})
