'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Phone, Mail, MapPin, Globe, Facebook, Twitter, Instagram } from 'lucide-react';

export default function SiteSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [settings, setSettings] = useState({
        support_phone: '',
        support_email: '',
        support_address: '',
        whatsapp_number: '',
        facebook_url: '',
        twitter_url: '',
        instagram_url: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/site-settings');
            const data = await res.json();
            if (data.success) {
                setSettings(data.settings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage({ type: '', text: '' });
            const res = await fetch('/api/site-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Settings updated successfully!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update settings' });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-100 min-h-[400px]">
                <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
                <p className="text-gray-500 font-medium">Loading site configurations...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-400 p-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Globe size={24} /> Site Support & Branding
                    </h2>
                    <p className="text-orange-50 text-sm opacity-90">Manage contact details and professional links shown on Website & Mobile App</p>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-8">
                    {/* Support Contacts */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                            <Phone size={18} className="text-orange-500" /> Support Contacts
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Support Hotline</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        value={settings.support_phone}
                                        onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                        placeholder="+91 XXXXX XXXXX"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Support Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="email"
                                        value={settings.support_email}
                                        onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                        placeholder="support@lokall.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">WhatsApp Number</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">WA</span>
                                    <input
                                        type="text"
                                        value={settings.whatsapp_number || ''}
                                        onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                        placeholder="+91 XXXXX XXXXX"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">Physical Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                                <textarea
                                    value={settings.support_address}
                                    onChange={(e) => setSettings({ ...settings, support_address: e.target.value })}
                                    rows={2}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                    placeholder="Enter full office or market address"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-6 pt-4">
                        <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                            <Facebook size={18} className="text-blue-600" /> Digital Presence
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Facebook URL</label>
                                <div className="relative">
                                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="url"
                                        value={settings.facebook_url || ''}
                                        onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                        placeholder="https://facebook.com/lokall"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Twitter URL</label>
                                <div className="relative">
                                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="url"
                                        value={settings.twitter_url || ''}
                                        onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                        placeholder="https://twitter.com/lokall"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Instagram URL</label>
                                <div className="relative">
                                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="url"
                                        value={settings.instagram_url || ''}
                                        onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                        placeholder="https://instagram.com/lokall"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-6 flex items-center justify-between border-t gap-4">
                        {message.text && (
                            <div className={`px-4 py-2 rounded-lg text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                {message.text}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={saving}
                            className="ml-auto flex items-center gap-2 px-8 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition disabled:opacity-50 shadow-lg shadow-orange-500/20 active:translate-y-0.5"
                        >
                            {saving ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <Save size={20} />
                            )}
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
