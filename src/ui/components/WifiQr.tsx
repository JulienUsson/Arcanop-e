import { useState } from 'react';
import { loadWifi, saveWifi, wifiPayload, type WifiSettings } from '../wifi';
import { QrCode } from './QrCode';

export function WifiQr() {
  const [open, setOpen] = useState(false);
  const [wifi, setWifi] = useState<WifiSettings>(loadWifi);
  const [showPassword, setShowPassword] = useState(false);

  const update = (patch: Partial<WifiSettings>) => {
    const next = { ...wifi, ...patch };
    setWifi(next);
    saveWifi(next);
  };

  const ready = wifi.ssid.trim() !== '' && (wifi.open || wifi.password !== '');

  return (
    <section className="panel wifi-qr">
      <button className="link" onClick={() => setOpen(!open)}>
        {open ? 'Masquer' : 'Afficher'} le QR code du Wi-Fi partagé
      </button>
      {open && (
        <>
          <p className="hint">
            Activez le partage de connexion de ce téléphone, puis faites scanner ce code aux archers : leur appareil photo propose de rejoindre le
            réseau. Les informations restent enregistrées sur ce téléphone.
          </p>
          <label className="field">
            <span>Nom du réseau</span>
            <input value={wifi.ssid} onChange={(e) => update({ ssid: e.target.value })} placeholder="iPhone de Julien" autoComplete="off" />
          </label>
          <div className="segmented">
            <button className={!wifi.open ? 'selected' : ''} onClick={() => update({ open: false })}>
              🔒 Mot de passe
            </button>
            <button className={wifi.open ? 'selected' : ''} onClick={() => update({ open: true })}>
              🔓 Ouvert
            </button>
          </div>
          {!wifi.open && (
            <label className="field">
              <span>Mot de passe</span>
              <span className="row">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={wifi.password}
                  onChange={(e) => update({ password: e.target.value })}
                  autoComplete="off"
                />
                <button className="ghost small" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Masquer' : 'Afficher'}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </span>
            </label>
          )}
          {ready ? (
            <QrCode value={wifiPayload(wifi)} label="Wi-Fi partagé" />
          ) : (
            <p className="hint">Renseignez le nom du réseau{wifi.open ? '' : ' et son mot de passe'} pour afficher le QR code.</p>
          )}
        </>
      )}
    </section>
  );
}
