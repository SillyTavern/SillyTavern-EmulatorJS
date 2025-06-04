# SillyTavern-EmulatorJS

This extension allows you to play retro console games right from the SillyTavern chat.

See the original README below. Thanks libretro and EmulatorJS projects for making this possible.

Current EmulatorJS version: [4.2.1](https://github.com/EmulatorJS/EmulatorJS/releases/tag/v4.2.1)

## Features

Cool stuff:

- Unnecessary and absurd concept.
- AI can provide immersive comments on your gameplay (compatible model required).
- Simple ROM file management. ROMs are stored in your browser.
- All EmulatorJS cores supported.
  - Nintendo
  - Sega
  - Atari
  - PlayStation
  - many more

Limitations:

- AI can't play the game with you as a second player (yet).
- No built-in ROMs. But you can find them [anywhere](https://archive.org/details/ni-romsets).

## Installation and Usage

### Prerequisites

- Latest release version of SillyTavern.
- ROM and/or BIOS files downloaded from the net.

### Installation

Install using SillyTavern's third-party extensions installer using this link:

`https://github.com/SillyTavern/SillyTavern-EmulatorJS`

### Usage

- Open the "EmulatorJS" extension menu.
- Click "Add ROM file".
- Select the game file to add. Input the name and core (if it wasn't auto-detected).
- Some cores (e.g. PlayStation) require you to provide a BIOS file. See the [documentation](https://emulatorjs.org/docs4devs/cores) to find out what are the necessary files.
- Click the "Play" button in the list or launch via the wand menu.

## AI Commentary mode

With the power of multimodal models, your AI bots can see your gameplay and provide witty in-character comments.

### Requirements

1. Latest version of SillyTavern.
2. Latest update of EmulatorJS extension.
3. A browser that supports [ImageCapture](https://developer.mozilla.org/en-US/docs/Web/API/ImageCapture#browser_compatibility). Tested on desktop Chrome. Firefox requires to enable it with config. Safari won't work.
4. (If image inlining is enabled. Recommended) Chat Completion API key with a supported model.
5. (If image inlining is disabled) Multimodal captioning extension enabled and configured.

### How to enable

1. Make sure you set the interval of providing comments in the EmulatorJS extension settings. This setting defines how often the character is queried for comments using a screenshot of your current gameplay. A value of 0 indicates that no comments are provided.
2. Select a character chat and launch the game. For the best performance, make sure that the ROM file is properly named so that AI can have more background context.
3. Start playing as you normally would. The vision model will be queried periodically to write a comment based on the latest screenshot it "sees".

### Why I'm not seeing any comments?

Comments are temporarily paused (interval step skipped) if:

1. Emulator is paused (with a pause option, not in-game).
2. The browser window is out of focus.
3. The user input area is not empty. This is to let you type your reply in peace.
4. Another reply generation is currently in progress.
5. TTS voice is being read aloud. Comment is held off (30 seconds maximum) until it finishes, but not skipped.
6. A character card or group is currently open. Comment mode is disabled when starting the game from a welcome screen.

Other common issues:

1. Make sure you've set a commenting interval before launching the game.
2. Make sure you have set an API key and there are no errors in the ST server console.

Still doesn't work? Send us your browser debug console logs (press F12).

### Settings

1. Caption template - a prompt used to describe the in-game screenshot. `{{game}}` and `{{core}}` additional macro are supported.
2. Comment template - a prompt used to write a comment based on the generated caption. `{{game}}`, `{{core}}`, `{{caption}}` additional macro are supported. For image inlining mode, `{{caption}}` is replaced with `see included image`.

## Support and Contributions

Feel free to contribute.

## License

GPLv3

---

<div align = center>

<img width = 300 src = docs/Logo-light.png#gh-dark-mode-only>
<img width = 300 src = docs/Logo.png#gh-light-mode-only> 
 
<br>
<br>

[![Badge License]][License]
    
    
Self-hosted **Javascript** emulation for various system.

<br>

[![Button Website]][Website] 
[![Button Usage]][Usage]<br>
[![Button Configurator]][Configurator]<br>
[![Button Demo]][Demo] 
    
[![Button Contributors]][Contributors]   
 
Join our Discord server:

[![Join our Discord server!](https://invidget.switchblade.xyz/6akryGkETU)](https://discord.gg/6akryGkETU)

Or the Matrix server (#emulatorjs:matrix.emulatorjs.org):

<a href="https://matrix.to/#/#emulatorjs:matrix.emulatorjs.org" rel="noopener" target="_blank"><img src="https://matrix.to/img/matrix-badge.svg" alt="Chat on Matrix"></a>

</div>

<br>

> [!NOTE]  
> **As of EmulatorJS version 4.0, this project is no longer a reverse-engineered version of the emulatorjs.com project. It is now a complete re-write.**

> [!WARNING]  
> As of version 4.0.9 cores and minified files are no longer included in the repository. You will need to get them separately. You can get the from [releases](https://github.com/EmulatorJS/EmulatorJS/releases) or the * new CDN (see [this](#CDN) for more info). There is also a new version system that we will be using. (read [here](#Versioning) for more info).
>
> The history of the project has been rewritten and force pushed. You will likely need to redo any active commits you have. Sorry for the inconvenience.

> [!TIP]
> Cloning the repository is no longer recommended for production use. You should use [releases](https://github.com/EmulatorJS/EmulatorJS/releases) or the [CDN](https://cdn.emulatorjs.org/) instead.

<br>

### Ads

*This project has no ads.* <br>
*Although, the demo page currently has an ad to help fund this project.* <br>
*Ads on the demo page may come and go depending on how many people are* <br>
*funding this project.* <br>

*You can help fund this project on* ***[patreon]***

<br>


### Issues

*If something doesn't work, please consider opening an* ***[Issue]*** <br>
*with as many details as possible, as well as the console log.*

<br>

### Versioning
There are three different version names that you need to be aware of:
1. **stable** - This will be the most stable version of the emulator both code and cores will be tested before release. It will be updated every time a new version is released on GitHub. This is the default version on the Demo.
2. **latest** - This will contain the latest code but use the stable cores. This will be updated every time the *main* branch is updated.
3. **nightly** - This will contain the latest code and the latest cores. The cores will be updated every day, so this is consiterd alpha.

### CDN
There is a new CDN that you can use to get any version of the emulator. The cdn is `https://cdn.emulatorjs.org/`. You can use this to get the stable, latest, nightly and any other main version by setting your `EJS_pathtodata` to `https://cdn.emulatorjs.org/<version>/data/`.

### Extensions

 **[GameLibrary]**

   *A library overview for your **ROM** folder.*

<br>

### Development:

*Run a local server with:* 
```
npm i
npm start
```

<br>

**>> When reporting bugs, please specify that you are using the old version**

<br>
<br>
<br>

<h1 align = center>Supported Systems</h1>

<br>

<div align = center>

### Nintendo

**[Game Boy Advance][Nintendo Game Boy Advance]**   | 
**[Famicom / NES][NES / Famicom]**   | 
**[Virtual Boy][Virtual Boy]**
    
**[Game Boy][Nintendo Game Boy]**   | 
**[SNES]**   | 
**[DS][Nintendo DS]**   | 
**[64][Nintendo 64]**

<br>
<br>

### Sega

**[Master System][Sega Master System]**   | 
**[Mega Drive][Sega Mega Drive]**   | 
**[Game Gear][Sega Game Gear]**
    
**[Saturn][Sega Saturn]**   | 
**[32X][Sega 32X]**   | 
**[CD][Sega CD]**
    
<br>
<br>

### Atari

**[2600][Atari 2600]**   | 
**[5200][Atari 5200]**   | 
**[7800][Atari 7800]**   | 
**[Lynx][Atari Lynx]**   | 
**[Jaguar][Atari Jaguar]**

<br>
<br>

### Commodore

**[Commodore 64]** |
**[Commodore 128]** |
**[Commodore Amiga]**

**[Commodore PET]** |
**[Commodore Plus/4]** |
**[Commodore VIC-20]**

<br>
<br>

### Other
    
**[PlayStation]**   | 
**[Arcade]**   | 
**[3DO]**

**[MAME 2003]** |
**[ColecoVision]**
    
</div>

<br>

## Star History

<a href="https://star-history.com/#EmulatorJS/EmulatorJS&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=EmulatorJS/EmulatorJS&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=EmulatorJS/EmulatorJS&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=EmulatorJS/EmulatorJS&type=Date" />
 </picture>
</a>

<!-- 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 --->

[License]: LICENSE
[Issue]: https://github.com/ethanaobrien/emulatorjs/issues
[patreon]: https://patreon.com/EmulatorJS


<!-- 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮   Extensions   🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 --->

[GameLibrary]: https://github.com/Ramaerel/emulatorjs-GameLibrary


<!-- 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮   Quicklinks   🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 --->

[Configurator]: https://emulatorjs.org/editor
[Contributors]: docs/Contributors.md
[Website]: https://emulatorjs.org/
[Usage]: https://emulatorjs.org/docs/
[Demo]: https://demo.emulatorjs.org/


<!-- 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮  Systems  🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 -->

[Nintendo Game Boy Advance]: https://emulatorjs.org/docs/systems/nintendo-game-boy-advance
[Nintendo Game Boy]: https://emulatorjs.org/docs/systems/nintendo-game-boy
[Nintendo 64]: https://emulatorjs.org/docs/systems/nintendo-64
[Nintendo DS]: https://emulatorjs.org/docs/systems/nintendo-ds

[Sega Master System]: https://emulatorjs.org/docs/systems/sega-master-system
[Sega Mega Drive]: https://emulatorjs.org/docs/systems/sega-mega-drive
[Sega Game Gear]: https://emulatorjs.org/docs/systems/sega-game-gear
[Sega Saturn]: https://emulatorjs.org/docs/systems/sega-saturn
[Sega 32X]: https://emulatorjs.org/docs/systems/sega-32x
[Sega CD]: https://emulatorjs.org/docs/systems/sega-cd

[Atari Jaguar]: https://emulatorjs.org/docs/systems/atari-jaguar
[Atari Lynx]: https://emulatorjs.org/docs/systems/atari-lynx
[Atari 7800]: https://emulatorjs.org/docs/systems/atari-7800
[Atari 2600]: https://emulatorjs.org/docs/systems/atari-2600
[Atari 5200]: https://emulatorjs.org/docs/systems/atari-5200

[NES / Famicom]: https://emulatorjs.org/docs/systems/nes-famicom
[SNES]: https://emulatorjs.org/docs/systems/snes

<!--
[TurboGrafs-16 / PC Engine]: https://emulatorjs.org/systems/TurboGrafx-16
[MSX]: https://emulatorjs.org/systems/MSX
[WanderSwan / Color]: https://emulatorjs.org/systems/WonderSwan
[Neo Geo Poket]: https://emulatorjs.org/systems/Neo%20Geo%20Pocket
--->
[PlayStation]: https://emulatorjs.org/docs/systems/playstation
[Virtual Boy]: https://emulatorjs.org/docs/systems/virtual-boy
[Arcade]: https://emulatorjs.org/docs/systems/arcade
[3DO]: https://emulatorjs.org/docs/systems/3do
[MAME 2003]: https://emulatorjs.org/docs/systems/mame-2003
[ColecoVision]: https://emulatorjs.org/docs/systems/colecovision

[Commodore 64]: https://emulatorjs.org/docs/systems/commodore-64
[Commodore 128]: https://emulatorjs.org/docs/systems/commodore-128
[Commodore Amiga]: https://emulatorjs.org/docs/systems/commodore-amiga
[Commodore PET]: https://emulatorjs.org/docs/systems/commodore-pet
[Commodore Plus/4]: https://emulatorjs.org/docs/systems/commodore-plus4
[Commodore VIC-20]: https://emulatorjs.org/docs/systems/commodore-vic20


<!-- 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮  Badges  🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 🎮 --->

[Badge License]: https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge

[Button Configurator]: https://img.shields.io/badge/Configurator-992cb3?style=for-the-badge
[Button Contributors]: https://img.shields.io/badge/Contributors-54b7dd?style=for-the-badge
[Button Website]: https://img.shields.io/badge/Website-736e9b?style=for-the-badge
[Button Usage]: https://img.shields.io/badge/Usage-2478b5?style=for-the-badge
[Button Demo]: https://img.shields.io/badge/Demo-528116?style=for-the-badge
[Button Beta]: https://img.shields.io/badge/Beta-bb044f?style=for-the-badge
