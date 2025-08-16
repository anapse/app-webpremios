import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/footer.css';

import instagramIcon from '../assets/instagram.png';
import facebookIcon from '../assets/facebook.png';
import tiktokIcon from '../assets/tiktok.png';
import whatsappIcon from '../assets/whatsapp.png';

export default function Footer() {
  return (
   <footer className="footer">
  <div className="footer-top">
    <Link to="/libro-reclamaciones" className="footer-cta">📑 Libro de Reclamaciones</Link>
    <Link to="/terminos" className="footer-cta">📜 Términos y Condiciones</Link>
  </div>

  <div className="footer-bottom">
    <p className="footer-rights">&copy; 2025 Game Ztore. Todos los derechos reservados.</p>
    <div className="footer-social">
      <a href="https://www.instagram.com/game.ztore/#" target="_blank" rel="noreferrer"><img src={instagramIcon} alt="Instagram" /></a>
      <a href="https://www.facebook.com/gameztoreoficial/" target="_blank" rel="noreferrer"><img src={facebookIcon} alt="Facebook" /></a>
      <a href="https://www.tiktok.com/@gameztoreoficial" target="_blank" rel="noreferrer"><img src={tiktokIcon} alt="TikTok" /></a>
      <a href="https://wa.me/message/VTSAYXAD74NMM1" target="_blank" rel="noreferrer"><img src={whatsappIcon} alt="WhatsApp" /></a>
    </div>
  </div>
</footer>

  );
}
