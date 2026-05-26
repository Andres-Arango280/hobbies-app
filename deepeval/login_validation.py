from deepeval.test_case import LLMTestCase
from deepeval.metrics import AnswerRelevancyMetric
from deepeval import assert_test

metric = AnswerRelevancyMetric(threshold=0.7)

test_case = LLMTestCase(
    input="Login de usuario",
    actual_output="El usuario inició sesión correctamente"
)

assert_test(test_case, [metric])

print("Login validado")