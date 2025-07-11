#include "field.h"

Field::Field(std::string fileName)//Убрать из конструктора максимальные размеры
{
    std::fstream inputStr(fileName);
    data = json::parse(inputStr);
    long int maxHeight = 0;
    long int maxWidth = 0;
    for(long int i = 0; i < data["map"].size(); i++)
    {
        maxHeight = ((long int)(data["map"][i]["r"])+1) > maxHeight ? ((long int)(data["map"][i]["r"])+1) : maxHeight;
        maxWidth = ((long int)(data["map"][i]["q"])+1) > maxWidth ? ((long int)(data["map"][i]["q"])+1) : maxWidth;
    }
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
        field[data["map"][i]["q"]][data["map"][i]["r"]].type = static_cast<HEX_TYPE>(data["map"][i]["type"]);
        field[data["map"][i]["q"]][data["map"][i]["r"]].cost = data["map"][i]["cost"];
    }
    for(int i = 0; i < data["food"].size(); i++)
    {
        field[data["food"][i]["q"]][data["food"][i]["r"]].foodType = static_cast<FOOD_TYPE>(data["food"][i]["type"]);
        field[data["food"][i]["q"]][data["food"][i]["r"]].foodAmount = data["food"][i]["amount"];
    }
    for(int i = 0; i < data["ants"].size(); i++)
    {
        //ourAnts.push_back(Unit(data["ants"][i]["id"], data["ants"][i]["q"], data["ants"][i]["r"], data["ants"][i]["type"],
        //                       data["ants"][i]["health"], data["ants"][i]["food"]["amount"], data["ants"][i]["food"]["type"]));//тип еды привести к enum
    }
    for(int i = 0; i < data["enemies"].size(); i++)
    {
        //enemyAnts.push_back(Unit(0, data["ants"][i]["q"], data["ants"][i]["r"], data["ants"][i]["type"],
        //                      data["ants"][i]["health"], data["ants"][i]["food"]["amount"], data["ants"][i]["food"]["type"]));//тип еды привести к enum
    }
}
