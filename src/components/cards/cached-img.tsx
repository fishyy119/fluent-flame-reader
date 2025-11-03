import * as React from "react"

type ImgProps = {
    src: string
    className?: string
}

class CachedImg extends React.Component<ImgProps> {
    private static readonly _cache = new Map<string, HTMLImageElement>()
    private readonly _canvasRef = React.createRef<HTMLCanvasElement>()
    private _img: HTMLImageElement | null = null

    constructor(props: ImgProps) {
        super(props)
    }

    private draw() {
        const canvas = this._canvasRef.current
        if (!canvas || !this._img) {
            return
        }
        const maxWidth = 256
        const maxHeight = 256
        if (this._img.width > maxWidth || this._img.height > maxHeight) {
            const scaleFactor = Math.max(
                this._img.width / maxWidth,
                this._img.height / maxHeight,
            )
            canvas.width = this._img.width / scaleFactor
            canvas.height = this._img.height / scaleFactor
        } else {
            canvas.width = this._img.width
            canvas.height = this._img.height
        }
        const ctx = canvas.getContext("2d")
        ctx.drawImage(
            this._img,
            0,
            0,
            this._img.width,
            this._img.height,
            0,
            0,
            canvas.width,
            canvas.height,
        )
    }

    render(): React.ReactNode {
        const canvas = (
            <canvas
                className={this.props.className}
                ref={this._canvasRef}></canvas>
        )
        if (CachedImg._cache.has(this.props.src)) {
            this._img = CachedImg._cache.get(this.props.src)
        } else {
            this._img = new Image()
            CachedImg._cache.set(this.props.src, this._img)
            this._img.loading = "eager"
            this._img.src = this.props.src
        }
        this._img
            .decode()
            .then(() => this.draw())
            .catch(() => this.forceUpdate())
        return canvas
    }
}

export default CachedImg
