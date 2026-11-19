import logo from "@/assets/jago/logo-jago.png.asset.json";
import gerobak from "@/assets/jago/gerobak-jago.png.asset.json";
import phone from "@/assets/jago/hp-jago.gif.asset.json";
import videoHero from "@/assets/jago/video-hero.mp4.asset.json";
import videoBackground from "@/assets/jago/video-background.mp4.asset.json";
import qris from "@/assets/jago/qris.png.asset.json";
import checkoutIcon from "@/assets/jago/checkout-icon.png.asset.json";
import saltedCaramel from "@/assets/jago/salted-caramel-latte.png.asset.json";
import kopiSusu from "@/assets/jago/kopi-susu-jago.jpg.asset.json";
import americano from "@/assets/jago/americano.jpg.asset.json";
import coklat from "@/assets/jago/jago-coklat.jpg.asset.json";
import pinkCoco from "@/assets/jago/pink-coco.jpg.asset.json";
import montBlanc from "@/assets/jago/mont-blanc.jpg.asset.json";
import matcha from "@/assets/jago/matcha-latte.jpg.asset.json";
import citrus from "@/assets/jago/citrus-cold-brew.jpg.asset.json";

export const ASSETS = {
  logo: logo.url,
  gerobak: gerobak.url,
  phone: phone.url,
  videoHero: videoHero.url,
  videoBackground: videoBackground.url,
  qris: qris.url,
  checkoutIcon: checkoutIcon.url,
};

export const LANDING_DRINKS = [
  { name: "Pink Coco", image: pinkCoco.url },
  { name: "Mont Blanc Shake", image: montBlanc.url },
  { name: "Jago Americano", image: americano.url },
  { name: "Matcha Latte", image: matcha.url },
  { name: "Kopi Susu Jago", image: kopiSusu.url },
  { name: "Citrus Cold Brew", image: citrus.url },
  { name: "Salted Caramel Latte", image: saltedCaramel.url },
  { name: "Jago Chocolate", image: coklat.url },
];

export const FALLBACK_DRINK_IMAGE = logo.url;
