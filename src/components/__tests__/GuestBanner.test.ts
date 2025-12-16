/**
 * Komponenten-Tests für GuestBanner.vue
 * Testet Conditional Rendering und Form-Validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GuestBanner from '../GuestBanner.vue'
import { ref } from 'vue'

// Mock useAuth Composable
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    isGuest: ref(true),
    upgradeGuestToUser: vi.fn().mockResolvedValue({ success: true }),
    collectGuestData: vi.fn().mockReturnValue({
      hasHydration: true,
      historyCount: 2,
      hasProfile: true,
      history: [
        { volumeMl: 250, timestamp: '2024-11-01T10:00:00' },
        { volumeMl: 300, timestamp: '2024-11-01T11:00:00' }
      ]
    })
  })
}))

// Mock FontAwesome Icons
vi.mock('@fortawesome/vue-fontawesome', () => ({
  FontAwesomeIcon: {
    name: 'FontAwesomeIcon',
    template: '<i />'
  }
}))

describe('GuestBanner.vue', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('sollte Banner anzeigen wenn isGuest=true und Modal öffnen/schließen', async () => {
    const wrapper = mount(GuestBanner)

    // Banner sollte sichtbar sein
    expect(wrapper.find('.bg-gradient-to-r').exists()).toBe(true)
    expect(wrapper.text()).toContain('Gast-Modus aktiv')

    // Modal sollte initial nicht sichtbar sein
    expect(wrapper.find('.fixed.inset-0').exists()).toBe(false)

    // "Jetzt registrieren" Button klicken
    const registerButton = wrapper.find('button:not([title="Banner ausblenden"])')
    await registerButton.trigger('click')

    // Modal sollte jetzt sichtbar sein
    expect(wrapper.find('.fixed.inset-0').exists()).toBe(true)
    expect(wrapper.text()).toContain('Account erstellen')
  })

  it('sollte Form-Validation korrekt durchführen', async () => {
    const wrapper = mount(GuestBanner)

    // Modal öffnen
    const registerButton = wrapper.find('button:not([title="Banner ausblenden"])')
    await registerButton.trigger('click')

    // Submit ohne Daten
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Bitte fülle alle Felder aus')

    // Ungültige Email
    await wrapper.find('#upgrade-name').setValue('Test User')
    await wrapper.find('#upgrade-email').setValue('invalid-email')
    await wrapper.find('#upgrade-password').setValue('password123')
    await form.trigger('submit.prevent')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Bitte gib eine gültige E-Mail-Adresse ein')

    // Zu kurzes Passwort
    await wrapper.find('#upgrade-email').setValue('test@example.com')
    await wrapper.find('#upgrade-password').setValue('123')
    await form.trigger('submit.prevent')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Passwort muss mindestens 6 Zeichen lang sein')
  })
})
