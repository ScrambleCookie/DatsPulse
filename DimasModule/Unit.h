#pragma once
#include <vector>
#include <queue>
#include <utility>
#include "field.h"
#include <set>

enum UNITTYPES {
	worker, warrior, scout
};

class Unit
{
private:
	short int XP;
	short int Speed;
	int id;
	//long int x, y;
	short int foodAmount;
	short int maxFood;
	short int idFood;
	UNITTYPES typeAncent;
	std::pair<long int, long int> position;
	std::pair<long int, long int> target; //Цель которую юнит атакует в данный момент
	std::vector<std::vector<int> > move;
	static std::set<std::pair<long int, long int>> occupiedDefensePoints;
	static const int DEFENSE_RADIUS = 3;  // Радиус защиты муравейника
	static const int MAX_DEFENDERS = 2;    // Максимум защитников

	void setTarget(int x, int y);
	bool isEnemyInRange(const std::pair<long int, long int>& enemyPos);
	bool isAdjacent(const std::pair<long int, long int>& a, const std::pair<long int, long int>& b);
	std::vector<std::vector<int>> findPathToTarget();
public:
	Unit(int id_, long int x_, long int y_, UNITTYPES typeAncent_);

	std::vector<std::vector<int> > findingRoad(short int idTacticks);
	std::vector<std::vector<int>> defendAnthill(const std::pair<long int, long int>& anthillPos);
	
};