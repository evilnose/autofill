import "@angular/material/prebuilt-themes/indigo-pink.css";
import "./polyfills";
import "./vendor";
import "./styles.css";

import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
// import { enableProdMode } from '@angular/core';

import { AppModule } from "./app/app.module";

// if (process.env.WEBPACK_MODE === 'production') {
//     enableProdMode();
// }

platformBrowserDynamic().bootstrapModule(AppModule);
