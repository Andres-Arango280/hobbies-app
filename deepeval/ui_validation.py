from deepeval.test_case import LLMTestCase
from deepeval.metrics import GEval

metric = GEval(
    name="UI Check",
    criteria="La interfaz debe mostrar correctamente los datos del usuario",
    evaluation_params=["actual_output"]
)

test_case = LLMTestCase(
    input="Ver interfaz",
    actual_output="La interfaz muestra correctamente los hobbies"
)

print(metric.measure(test_case))