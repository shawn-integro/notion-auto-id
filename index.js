const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_KEY });
const notionDatabaseId = process.env.NOTION_DATABASE_ID;
const notionPageTitle = process.env.NOTION_PAGE_TITLE;
const notionPageId = process.env.NOTION_PAGE_ID;
const checkInterval = process.env.CHECK_INTERVAL;



async function updateTime() {
    date = new Date();
	date.setMinutes(date.getMinutes() - 1);
	return date.toISOString();
}



async function getPagesFromNotion(databaseId, filterObj) {
    let allPages = [];
    let pagesFromNotion = await notion.databases.query({
      database_id: databaseId,
      filter: filterObj,
    }).catch(error => {console.error(error)});
  
    allPages = [...pagesFromNotion.results];
  
    while (pagesFromNotion.has_more) {
      pagesFromNotion = await notion.databases.query({
        database_id: databaseId,
        filter: filterObj,
        start_cursor: pagesFromNotion.next_cursor,
      }).catch(error => {console.error(error)});
  
      allPages = [...allPages, ...pagesFromNotion.results];
    }
  
    return allPages;
}



async function postStatsToNotion(pageId, newVal) {
    const response = await notion.pages.update({
		page_id: pageId,
		properties: {
			[notionPageTitle]: {
				title: [
					{
						text: { content: newVal },
					},
				],
			},
		},
    }).catch(error => {console.error(error)});
  
    return response;
}



setInterval(checkOnInterval, checkInterval*1000);

async function checkOnInterval() {

	let filterRecently = {
		timestamp: "created_time",
		created_time: {
		after: await updateTime()
		}
	};

    let recentPages = await getPagesFromNotion(notionDatabaseId, filterRecently).catch(error => {console.error(error)});

	recentPages.forEach((item) => {
		if(item.properties[notionPageTitle].title.length == 0 || item.properties[notionPageTitle].title[0].text.content != item.properties[notionPageId].formula.string) {
			postStatsToNotion(item.id, item.properties[notionPageId].formula.string);
		}
	});
}