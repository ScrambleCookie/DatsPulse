#include "field.h"

Field::Field(std::string fileName)//Убрать из конструктора максимальные размеры
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
    for(int i = 0; i < data["ants"].size(); i++)
    {
        //ourAnts.push_back(Unit(data["ants"][i]["id"], (long int)(data["ants"][i]["q"])-xOffset, (long int)(data["ants"][i]["r"])-yOffset, data["ants"][i]["type"],
        //                       data["ants"][i]["health"], data["ants"][i]["food"]["amount"], static_cast<FOOD_TYPE>(data["ants"][i]["food"]["type"])));
    }
    for(int i = 0; i < data["enemies"].size(); i++)
    {
        //enemyAnts.push_back(Unit(0, (long int)(data["ants"][i]["q"])-xOffset, (long int)(data["ants"][i]["r"])-yOffset, data["ants"][i]["type"],
        //                      data["ants"][i]["health"], data["ants"][i]["food"]["amount"], (static_cast<FOOD_TYPE> data["ants"][i]["food"]["type"])));
    }
    for (long int i = 0; i < data["map"].size(); i++) {
        // Типа сохранение позиции муравейника
        if (static_cast<HEX_TYPE>(data["map"][i]["type"]) == HIVE) {
            anthillPosition = {
                (long int)(data["map"][i]["q"]),
                (long int)(data["map"][i]["r"])
            };
        }
    }
}
std::pair<long int, long int> Field::getAnthillPosition() const {
    return anthillPosition;
}