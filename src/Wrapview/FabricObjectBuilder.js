class FabricObjectBuilder {
    constructor(editor) {
        this.editor = editor;
    }

    createText({ id, left, top, text, fontSize = 24, fontFamily = 'Arial, sans-serif', fontWeight = 'normal', fontStyle = 'normal', fill = '#000', stroke, strokeWidth, tMode = null, tIntensity = 0 }) {
        // Use native Fabric.js text for simple cases
        if (!tMode || tMode === 'none') {
            const textProps = {
                left, top, fontSize, fontFamily, fontWeight, fontStyle, fill,
                originX: 'left', originY: 'top',
                objectCaching: false,
                editable: true
            };

            if (stroke) textProps.stroke = stroke;
            if (strokeWidth) textProps.strokeWidth = strokeWidth;

            const t = new fabric.IText(text || '', textProps);
            t._wve = { id, type: 'text', tMode: null, tIntensity: 0, isCurved: false, stroke, strokeWidth, fontWeight, fontStyle };
            return t;
        }

        // Use native Fabric.js angle property for rotation
        if (tMode === 'angle') {
            const textProps = {
                left, top, fontSize, fontFamily, fontWeight, fontStyle, fill,
                originX: 'left', originY: 'top',
                objectCaching: false,
                editable: true,
                angle: this._mapAngleFromPercent(tIntensity || 0)
            };

            if (stroke) textProps.stroke = stroke;
            if (strokeWidth) textProps.strokeWidth = strokeWidth;

            const t = new fabric.IText(text || '', textProps);
            t._wve = { id, type: 'text', tMode, tIntensity, isCurved: false, stroke, strokeWidth, fontWeight, fontStyle };
            return t;
        }

        // Use simplified curved text for complex transformations
        return this._buildCurvedTextGroup({ id, left, top, text, fontSize, fontFamily, fontWeight, fontStyle, fill, stroke, strokeWidth, tMode, tIntensity });
    }

    _buildCurvedTextGroup({ id, left, top, text = '', fontSize, fontFamily, fontWeight, fontStyle, fill, stroke, strokeWidth, tMode, tIntensity }) {
        const chars = String(text).split('');
        const items = [];
        const radius = Math.max(100, fontSize * 3);
        const intensity = this._clampIntensity(tIntensity, 0) / 100;

        for (let i = 0; i < chars.length; i++) {
            const charProps = {
                fontSize,
                fontFamily,
                fontWeight,
                fontStyle,
                fill,
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                objectCaching: false
            };

            if (stroke) charProps.stroke = stroke;
            if (strokeWidth) charProps.strokeWidth = strokeWidth;

            const ch = new fabric.Text(chars[i], charProps);
            const position = this._getCharPosition(i, chars.length, { tMode, radius, fontSize, intensity });

            ch.set({
                left: left + position.x,
                top: top + position.y,
                angle: position.angle
            });

            items.push(ch);
        }

        // Create Fabric.js Group to hold all characters
        const group = new fabric.Group(items, {
            left: left,
            top: top,
            originX: 'center',
            originY: 'center',
            objectCaching: false,
            subTargetCheck: false
        });
        group._wve = { id, type: 'text', tMode, tIntensity, isCurved: true, text, fontSize, fontFamily, fontWeight, fontStyle, fill, stroke, strokeWidth };
        return group;
    }

    _getCharPosition(index, totalChars, { tMode, radius, fontSize, intensity }) {
        const charSpacing = fontSize * 0.6;
        const totalWidth = totalChars * charSpacing;
        const startX = -totalWidth / 2;
        const baseX = startX + index * charSpacing;

        switch (tMode) {
            case 'arch': {
                const angleSpread = Math.PI * 0.5 * intensity;
                const angle = (index / (totalChars - 1 || 1) - 0.5) * angleSpread;
                const effectiveRadius = radius * (1 + Math.abs(intensity));
                return {
                    x: baseX,
                    y: -Math.abs(Math.sin(angle)) * effectiveRadius * 0.5,
                    angle: angle * (180 / Math.PI)
                };
            }

            case 'bridge': {
                const angleSpread = Math.PI * 0.5 * intensity;
                const angle = (index / (totalChars - 1 || 1) - 0.5) * angleSpread;
                const effectiveRadius = radius * (1 + Math.abs(intensity));
                return {
                    x: baseX,
                    y: Math.abs(Math.sin(angle)) * effectiveRadius * 0.5,
                    angle: angle * (180 / Math.PI)
                };
            }

            case 'valley': {
                const progress = index / (totalChars - 1 || 1);
                const curve = Math.sin(progress * Math.PI);
                return {
                    x: baseX,
                    y: curve * fontSize * 2 * intensity,
                    angle: 0
                };
            }

            case 'bulge': {
                const progress = index / (totalChars - 1 || 1);
                const curve = Math.sin(progress * Math.PI);
                return {
                    x: baseX,
                    y: -curve * fontSize * 2 * intensity,
                    angle: 0
                };
            }

            case 'flag': {
                const progress = index / totalChars;
                const wave = Math.sin(progress * Math.PI * 2);
                return {
                    x: baseX,
                    y: wave * fontSize * intensity,
                    angle: Math.cos(progress * Math.PI * 2) * 15 * intensity
                };
            }

            case 'distort': {
                const progress = index / totalChars;
                const wave = Math.sin(progress * Math.PI * 3);
                return {
                    x: baseX,
                    y: wave * fontSize * 0.8 * intensity,
                    angle: wave * 10 * intensity
                };
            }

            case 'circle': {
                const angleSpread = Math.PI * (1 + intensity);
                const angle = (index / (totalChars - 1 || 1)) * angleSpread - angleSpread / 2;
                const effectiveRadius = radius * (1 + Math.abs(intensity) * 0.5);
                return {
                    x: Math.sin(angle) * effectiveRadius,
                    y: -Math.cos(angle) * effectiveRadius,
                    angle: angle * (180 / Math.PI)
                };
            }

            default:
                return { x: baseX, y: 0, angle: 0 };
        }
    }

    rebuildTextObject(fobj, patch = {}) {
        const metaOld = fobj._wve || {};
        const meta = Object.assign({}, metaOld, patch);
        const leftTop = this.editor._getObjectAnchor(fobj);
        const resolvedText =
            (patch.text !== undefined ? patch.text : undefined) ??
            (metaOld.isCurved ? (metaOld.text || '') : (fobj.text || ''));

        const newObj = this.createText({
            id: meta.id,
            left: leftTop.left,
            top: leftTop.top,
            text: resolvedText,
            fontSize: meta.fontSize !== undefined ? meta.fontSize : (fobj.fontSize || 24),
            fontFamily: meta.fontFamily !== undefined ? meta.fontFamily : (fobj.fontFamily || 'Arial, sans-serif'),
            fontWeight: meta.fontWeight !== undefined ? meta.fontWeight : (fobj.fontWeight || 'normal'),
            fontStyle: meta.fontStyle !== undefined ? meta.fontStyle : (fobj.fontStyle || 'normal'),
            fill: meta.fill !== undefined ? meta.fill : (fobj.fill || '#000'),
            stroke: meta.stroke !== undefined ? meta.stroke : (metaOld.stroke || fobj.stroke),
            strokeWidth: meta.strokeWidth !== undefined ? meta.strokeWidth : (metaOld.strokeWidth || fobj.strokeWidth),
            tMode: meta.tMode || null,
            tIntensity: meta.tIntensity || 0
        });

        this.editor._replaceObject(fobj, newObj);
        return newObj;
    }

    _clampIntensity(value, def = 0) {
        const n = Number(value);
        const v = Number.isFinite(n) ? n : def;
        return Math.max(-100, Math.min(100, Math.round(v)));
    }

    _mapAngleFromPercent(pct) {
        const p = this._clampIntensity(pct, 0);
        return p * 0.9;
    }
}

export { FabricObjectBuilder };