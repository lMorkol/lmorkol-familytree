from sqlalchemy.orm import Session

from app.models.human import Human


class HumanRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, human_id: int) -> Human | None:
        return self.db.query(Human).filter(Human.human_id == human_id, Human.is_deleted == False).first()

    def get_by_ids(self, human_ids: list[int]) -> list[Human]:
        if not human_ids:
            return []
        return self.db.query(Human).filter(Human.human_id.in_(human_ids), Human.is_deleted == False).all()

    def get_by_tree(self, tree_id: int, search: str | None = None,
                    first_name: str | None = None, second_name: str | None = None,
                    gender: str | None = None, place_of_birth: str | None = None,
                    country: str | None = None, limit: int | None = None,
                    offset: int | None = None) -> list[Human]:
        q = self.db.query(Human).filter(Human.tree_id == tree_id, Human.is_deleted == False)
        if search:
            pattern = f"%{search}%"
            q = q.filter(
                (Human.first_name.ilike(pattern))
                | (Human.second_name.ilike(pattern))
                | (Human.patronymic.ilike(pattern))
            )
        if first_name:
            q = q.filter(Human.first_name.ilike(f"%{first_name}%"))
        if second_name:
            q = q.filter(Human.second_name.ilike(f"%{second_name}%"))
        if gender:
            q = q.filter(Human.gender == gender)
        if place_of_birth:
            cities = [c.strip() for c in place_of_birth.split(",") if c.strip()]
            if cities:
                from sqlalchemy import or_
                q = q.filter(or_(*[Human.place_of_birth.ilike(f"%{c}%") for c in cities]))
        if country:
            countries = [c.strip() for c in country.split(",") if c.strip()]
            if countries:
                from sqlalchemy import or_
                q = q.filter(or_(*[Human.country.ilike(f"%{c}%") for c in countries]))
        q = q.order_by(Human.birth_date.desc().nullslast())
        if offset:
            q = q.offset(offset)
        if limit:
            q = q.limit(limit)
        return q.all()

    def count_by_tree(self, tree_id: int, search: str | None = None,
                      first_name: str | None = None, second_name: str | None = None,
                      gender: str | None = None, place_of_birth: str | None = None,
                      country: str | None = None) -> int:
        q = self.db.query(Human).filter(Human.tree_id == tree_id, Human.is_deleted == False)
        if search:
            pattern = f"%{search}%"
            q = q.filter(
                (Human.first_name.ilike(pattern))
                | (Human.second_name.ilike(pattern))
                | (Human.patronymic.ilike(pattern))
            )
        if first_name:
            q = q.filter(Human.first_name.ilike(f"%{first_name}%"))
        if second_name:
            q = q.filter(Human.second_name.ilike(f"%{second_name}%"))
        if gender:
            q = q.filter(Human.gender == gender)
        if place_of_birth:
            cities = [c.strip() for c in place_of_birth.split(",") if c.strip()]
            if cities:
                from sqlalchemy import or_
                q = q.filter(or_(*[Human.place_of_birth.ilike(f"%{c}%") for c in cities]))
        if country:
            countries = [c.strip() for c in country.split(",") if c.strip()]
            if countries:
                from sqlalchemy import or_
                q = q.filter(or_(*[Human.country.ilike(f"%{c}%") for c in countries]))
        return q.count()

    def create(self, tree_id: int, first_name: str | None, second_name: str | None,
               patronymic: str | None, gender: str, birth_date=None, death_date=None,
               place_of_birth: str | None = None, country: str | None = None) -> Human:
        human = Human(
            tree_id=tree_id,
            first_name=first_name,
            second_name=second_name,
            patronymic=patronymic,
            gender=gender,
            birth_date=birth_date,
            death_date=death_date,
            place_of_birth=place_of_birth,
            country=country,
        )
        self.db.add(human)
        self.db.commit()
        self.db.refresh(human)
        return human

    def update(self, human: Human, **kwargs) -> Human:
        for key, value in kwargs.items():
            if value is not None:
                setattr(human, key, value)
        self.db.commit()
        self.db.refresh(human)
        return human

    def soft_delete(self, human: Human) -> Human:
        human.is_deleted = True
        self.db.commit()
        return human

    def get_distinct_cities(self, tree_id: int) -> list[str]:
        from sqlalchemy import distinct
        rows = (
            self.db.query(distinct(Human.place_of_birth))
            .filter(Human.tree_id == tree_id, Human.is_deleted == False, Human.place_of_birth.isnot(None), Human.place_of_birth != "")
            .all()
        )
        return sorted([r[0] for r in rows])

    def get_distinct_countries(self, tree_id: int) -> list[str]:
        from sqlalchemy import distinct
        rows = (
            self.db.query(distinct(Human.country))
            .filter(Human.tree_id == tree_id, Human.is_deleted == False, Human.country.isnot(None), Human.country != "")
            .all()
        )
        return sorted([r[0] for r in rows])
