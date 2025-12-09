export class WrapviewUtils {
    static shiftOrigin(point, origin) {
        return {
            x: point.x - origin.x,
            y: point.y - origin.y
        }
    }
    static rotate(point, angle) {
        var sXd = point.x * Math.cos(angle) + point.y * Math.sin(angle);
        var sYd = point.y * Math.cos(angle) - point.x * Math.sin(angle);
        return {
            x: sXd,
            y: sYd
        }
    }
    static distance(p1, p2) {
        var x = p1.x - p2.x;
        var xs = x * x;
        var y = p1.y - p2.y;
        var ys = y * y;
        return Math.sqrt(xs + ys);
    }

    static vector(p1, p2) {
        var x = p2.x - p1.x;
        var y = p2.y - p1.y;
        return {
            x, y
        }
    }

    static angle(v1) {
        return Math.atan2(v1.y, v1.x)
    }

    static angleBetween(v1, v2) {
        return WrapviewUtils.angle(v2) - WrapviewUtils.angle(v1);
    }

    static snap(p, b) {
        var x = b.width / 2;
        var y = b.height / 2;
        var np = {
            x: p.x,
            y: p.y
        }
        var didX = false;
        var didY = false;



        if (Math.abs(p.x - x) < 10) {
            np.x = x;
            didX = true;
        }
        if (Math.abs(p.y - y) < 10) {
            np.y = y;
            didY = true;
        }
        return {
            point: np,
            snapState: {
                x: didX,
                y: didY
            }
        };

    }

    static toDegrees(a) {
        return parseFloat((180 / Math.PI) * a);
    }

    static toRadians(a) {
        return parseFloat(a / (180 / Math.PI));
    }

    static snapAngle(a) {

        if (a > 2 * Math.PI) {
            a = a - 2 * Math.PI;
        }
        var angle = a;

        if (Math.abs(a) < Math.PI / 8) {
            angle = 0;
        } else if (Math.abs(a - Math.PI / 4) < Math.PI / 8) {
            angle = Math.PI / 4;
        } else if (Math.abs(a - Math.PI / 2) < Math.PI / 8) {
            angle = Math.PI / 2;
        } else if (Math.abs(a - 3 * Math.PI / 4) < Math.PI / 8) {
            angle = 3 * Math.PI / 4;
        } else if (Math.abs(a - Math.PI) < Math.PI / 8) {
            angle = Math.PI;
        } else if (Math.abs(a - Math.PI * 1.25) < Math.PI / 8) {
            angle = Math.PI * 1.25;
        } else if (Math.abs(a - Math.PI * 1.5) < Math.PI / 8) {
            angle = Math.PI * 1.5;
        } else if (Math.abs(a - Math.PI * 1.75) < Math.PI / 8) {
            angle = Math.PI * 1.75;
        } else if (Math.abs(a - Math.PI * 2) < Math.PI / 8) {
            angle = Math.PI * 2;
        }

        return angle;
    }

    static s4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    static guid() {
        return (WrapviewUtils.s4() + WrapviewUtils.s4() + "" + WrapviewUtils.s4() + "" + WrapviewUtils.s4() + "" + WrapviewUtils.s4() + "" + WrapviewUtils.s4() + WrapviewUtils.s4() + WrapviewUtils.s4());
    }
}