import json

import pytest

import plan

CORTES = [{"ini": 4, "fin": 5}]


def escribir(tmp_path, **campos):
    datos = {"clip": "reels/trabajo/mi-reel/cortado.mp4", "palabras": "reels/trabajo/mi-reel/cortado.palabras.json"}
    datos.update(campos)
    p = tmp_path / "plan.json"
    p.write_text(json.dumps(datos, ensure_ascii=False), encoding="utf-8")
    return p


def test_remapear_antes_de_un_corte():
    assert plan.remapear(3, CORTES) == 3


def test_remapear_despues_de_un_corte():
    assert plan.remapear(6, CORTES) == 5


def test_remapear_dentro_de_un_corte():
    assert plan.remapear(4.5, CORTES) is None


def test_tramo_que_cruza_un_corte_se_recorta():
    assert plan.remapear_tramo(3, 6, CORTES) == (3, 5)


def test_tramo_entero_dentro_de_un_corte_se_descarta():
    assert plan.remapear_tramo(4.2, 4.8, CORTES) is None


def test_cortes_desordenados_y_solapados():
    cortes = [{"ini": 8, "fin": 9}, {"ini": 4, "fin": 5}, {"ini": 4.5, "fin": 6}]
    assert plan.remapear(10, cortes) == 7
    assert plan.tramos_que_quedan(cortes, 12) == [(0, 4), (6, 8), (9, 12)]


def test_nombres_de_efectos_salen_de_fx_py():
    assert {"noise", "phone-fan", "orbit"} <= plan.NOMBRES_FX
    assert "fan" in plan.NOMBRES_FX                       # alias
    assert "glitter-spotlight" in plan.NOMBRES_FX         # aspecto con nombre propio


def test_recursos_salen_de_la_carpeta_del_motor():
    assert {"reels-muro", "vistas", "campana", "palabra-caja"} <= plan.RECURSOS


def test_plan_rechaza_fx_desconocido(tmp_path):
    p = escribir(tmp_path, fx=[{"ini": 0, "fin": 2, "fx": "explosion"}])
    with pytest.raises(ValueError, match="explosion"):
        plan.leer_plan(p)


def test_plan_rechaza_recurso_desconocido(tmp_path):
    p = escribir(tmp_path, recursos=[{"ini": 0, "fin": 2, "tipo": "cohete"}])
    with pytest.raises(ValueError, match="cohete"):
        plan.leer_plan(p)


def test_plan_rechaza_tramo_invertido(tmp_path):
    p = escribir(tmp_path, recursos=[{"ini": 3, "fin": 3, "tipo": "vistas"}])
    with pytest.raises(ValueError):
        plan.leer_plan(p)


def test_plan_rechaza_corte_invertido(tmp_path):
    p = escribir(tmp_path, cortes=[{"ini": 2, "fin": 1}])
    with pytest.raises(ValueError):
        plan.leer_plan(p)


def test_plan_sin_clip(tmp_path):
    p = tmp_path / "plan.json"
    p.write_text("{}", encoding="utf-8")
    with pytest.raises(ValueError, match="clip"):
        plan.leer_plan(p)


def test_plan_valido(tmp_path):
    p = escribir(tmp_path, cortes=[{"ini": 0.5, "fin": 0.8, "motivo": "eh"}],
                 fx=[{"ini": 0, "fin": 2, "fx": "noise"}],
                 recursos=[{"ini": 2, "fin": 5, "tipo": "palabra-caja", "opts": {"palabra": "empezar"}}])
    datos = plan.leer_plan(p)
    assert datos["aprobado"] is False and datos["camara"] == []


def test_ejemplo_del_motor_es_valido():
    datos = plan.leer_plan(plan.SCRIPTS / "motor" / "ejemplo_plan.json")
    assert datos["recursos"][0]["tipo"] == "palabra-caja"
