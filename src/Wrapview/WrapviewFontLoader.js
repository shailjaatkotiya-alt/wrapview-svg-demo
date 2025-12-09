export class WrapviewFontLoader {
    constructor() { }

    load(font) {

        return new Promise((resolve, reject) => {
            if (font.source === 'local') {
                var _canvas = document.createElement('canvas');
                _canvas.width = 100;
                _canvas.height = 100;
                var container = document.getElementById('fontContainer');

                if (container) {
                    var _p = document.createElement('p');
                    var cls = font.family.replace(/\s+/g, '-').toLowerCase();
                    _p.className = 'font-' + cls;
                    var text = document.createTextNode("ABCDE");
                    _p.appendChild(text);
                    container.appendChild(_p);
                    container.appendChild(_canvas);
                }
                var _context = _canvas.getContext('2d');
                _context.fillStyle = '#000000';
                _context.font = '20px' + font.family;
                _context.fillText("99", 30, 30);

                setTimeout(() => {
                    _canvas.remove();
                    _context = null;
                    _canvas = null;
                    resolve();
                }, 250)
                return;
            }
            var d = {
                classes: false,
                fontactive(familyName, fvd) {
                    if (familyName === font.family) {
                        resolve();
                    }
                }
            }
            d[font.source] = {
                families: [font.family]
            };

            WebFontLoader.load(d);
        });
    }
}