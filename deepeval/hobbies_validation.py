from deepeval.test_case import LLMTestCase
from deepeval.metrics import GEval
from deepeval import assert_test

metric = GEval(
    name="Hobby Validation",
    criteria="El hobby debe aparecer correctamente en la lista",
    evaluation_params=["actual_output"]
)

test_case = LLMTestCase(
    input="Agregar hobby Natación",
    actual_output="Natación aparece en la lista de hobbies"
)

assert_test(test_case, [metric])

print("Hobbies validados")