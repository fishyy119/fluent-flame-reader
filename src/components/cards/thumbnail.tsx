import * as React from "react"
import { RSSItem } from "../../scripts/models/item"
import CachedImg from "./cached-img"

type CardThumbnailProps = {
    item: RSSItem
    className?: string
}

const mediaElement = (props: CardThumbnailProps) => {
    return (
        <CachedImg
            src={props.item.thumb}
            className={props.className}></CachedImg>
    )
}

const CardThumbnail: React.FunctionComponent<CardThumbnailProps> = props =>
    props.item.thumb ? mediaElement(props) : null
export default CardThumbnail
