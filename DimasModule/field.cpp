#include "field.h"

Field::Field(std::string fileName)
{
    std::fstream inputStr(fileName);
    data = json::parse(inputStr);
    long int maxHeight = -2147000000;
    long int maxWidth = -2147000000;
    long int minHeight = 2147000000;
    long int minWidth = 2147000000;
    for(long int i = 0; i < data["map"].size(); i++)
    {
        maxHeight = (long int)(data["map"][i]["r"]) > maxHeight ? (long int)(data["map"][i]["r"]) : maxHeight;
        maxWidth = (long int)(data["map"][i]["q"]) > maxWidth ? (long int)(data["map"][i]["q"]) : maxWidth;
        minHeight = (long int)(data["map"][i]["r"]) < minHeight ? (long int)(data["map"][i]["r"]) : minHeight;
        minWidth = (long int)(data["map"][i]["q"]) < minWidth ? (long int)(data["map"][i]["q"]) : minWidth;
    }
    minHeight -= 10;
    minWidth -= 10;
    maxHeight += 10;
    maxWidth += 10;

    width = maxWidth - minWidth + 1;
    height = maxHeight - minHeight + 1;
    xOffset = minWidth % 2 == 0 ? minWidth : minWidth+1;
    yOffset = minHeight % 2 == 0 ? minHeight : minHeight+1;

    std::vector<Hex> buff1;
    Hex buff = {HEX_TYPE::UNKNOWN, FOOD_TYPE::APPLE, 0, 0};
    for(long int i = 0; i < width; i++)
    {
        for(long int j = 0; j < height; j++)
        {
            buff1.push_back(buff);
        }
        field.push_back(buff1);
        buff1.clear();
    }
    for(long int i = 0; i < data["map"].size(); i++)
    {
        field[(long int)(data["map"][i]["q"])-xOffset][(long int)(data["map"][i]["r"])-yOffset].type = static_cast<HEX_TYPE>(data["map"][i]["type"]);
        field[(long int)(data["map"][i]["q"])-xOffset][(long int)(data["map"][i]["r"])-yOffset].cost = data["map"][i]["cost"];
    }
    for(int i = 0; i < data["food"].size(); i++)
    {
        field[(long int)(data["food"][i]["q"])-xOffset][(long int)(data["food"][i]["r"])-yOffset].foodType = static_cast<FOOD_TYPE>(data["food"][i]["type"]);
        field[(long int)(data["food"][i]["q"])-xOffset][(long int)(data["food"][i]["r"])-yOffset].foodAmount = data["food"][i]["amount"];
    }
}

std::vector<std::pair<long int, long int>> Field::getNearHexes(long int x, long int y)
{
    std::pair<long int, long int> buff;
    std::vector<std::pair<long int, long int>> ans;
    buff.first = x + 1;
    buff.second = y;
    ans.push_back(buff);
    buff.first = x - 1;
    buff.second = y;
    ans.push_back(buff);
    buff.first = x;
    buff.second = y + 1;
    ans.push_back(buff);
    buff.first = x;
    buff.second = y - 1;
    ans.push_back(buff);
    if(y % 2 == 0)
    {
        buff.first = x - 1;
        buff.second = y - 1;
        ans.push_back(buff);
        buff.first = x - 1;
        buff.second = y + 1;
        ans.push_back(buff);
    }
    else
    {
        buff.first = x + 1;
        buff.second = y - 1;
        ans.push_back(buff);
        buff.first = x + 1;
        buff.second = y + 1;
        ans.push_back(buff);
    }
    return ans;
}
