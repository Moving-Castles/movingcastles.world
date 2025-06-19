// ICONS
import {
    MdGames,
    MdHome,
    MdArticle
} from "react-icons/md"

export default (S) =>
    S.list()
        .title("Moving Castles")
        .items([
            S.listItem()
                .title("About")
                .icon(MdHome)
                .child(
                    S.editor()
                        .id("about")
                        .title("About")
                        .schemaType("about")
                        .documentId("about")
                ),
            S.listItem()
                .title("Projects")
                .icon(MdGames)
                .child(
                    S.documentList()
                        .title('Projects')
                        .showIcons(true)
                        .filter("_type == $type")
                        .params({ type: "project" })
                ),
            S.listItem()
                .title("Posts")
                .icon(MdArticle)
                .child(
                    S.documentList()
                        .title('Posts')
                        .showIcons(true)
                        .filter("_type == $type")
                        .params({ type: "post" })
                ),
        ])
